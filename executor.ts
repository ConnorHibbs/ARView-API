const _ = require('lodash');

const returnTypeEnum = {
    OBJECT: 0,
    ARRAY: 1
};

export function neo4jgraphql(object, params, context, resolveInfo, matcher) {
    let type = innerType(resolveInfo.returnType).toString();
    let variable = type.charAt(0).toLowerCase() + type.slice(1);
    let query = cypherQuery(params, context, resolveInfo, matcher);
    let returnType = resolveInfo.returnType.toString().startsWith("[") ? returnTypeEnum.ARRAY : returnTypeEnum.OBJECT;

    let session = context.driver.session();
    let data = session.run(query, params)
        .then( result => {
            if (returnType === returnTypeEnum.ARRAY) {
                return result.records.map(record => { return record.get(variable)})
            } else if (returnType === returnTypeEnum.OBJECT) {
                if (result.records.length > 0) {
                    // FIXME: use one of the new neo4j-driver consumers when upgrading neo4j-driver package
                    return result.records[0].get(variable);
                } else {
                    return null;
                }
            }
        });
    return data;
}

export function cypherQuery(params, context, resolveInfo, matcher) {
    let pageParams = {
        "first": params['first'] === undefined ? -1 : params['first'],
        "offset": params['offset'] || 0
    };

    delete params['first'];
    delete params['offset'];

    let type = innerType(resolveInfo.returnType).toString();
    let variable = type.charAt(0).toLowerCase() + type.slice(1);
    let schemaType = resolveInfo.schema.getType(type);


    let filteredFieldNodes = _.filter(resolveInfo.fieldNodes, function(o) {
        if (o.name.value === resolveInfo.fieldName) {
            return true;
        }
    });

    // FIXME: how to handle multiple fieldNode matches
    let selections = filteredFieldNodes[0].selectionSet.selections;
    let argString = JSON.stringify(params).replace(/\"([^(\")"]+)\":/g,"$1:"); // FIXME: support IN for multiple values -> WHERE

    let query;
    if(!matcher) {
        query = `MATCH (${variable}:${type} ${argString}) `;
        // console.log("There is no matcher, using the default:", query);
    } else {
        query = `MATCH (${variable}:${type}) WHERE ${matcher} `;
        // console.log("There is a custom matcher, using that:", query);
    }


    query = query +  `RETURN ${variable} {` + buildCypherSelection(``, selections, variable, schemaType, resolveInfo);// ${variable} { ${selection} } as ${variable}`;

    query = query + `} AS ${variable}`;

    query = query + ` SKIP ${pageParams.offset}${pageParams.first > -1 ? " LIMIT "+pageParams.first: ""}`;

    return query;
}

function buildCypherSelection(initial, selections, variable, schemaType, resolveInfo) { //FIXME: resolveInfo not needed

    if (selections.length === 0) {
        return initial;
    }

    const [headSelection, ...tailSelections] = selections;

    const fieldName = headSelection.name.value;
    if (!schemaType.getFields()[fieldName]){
        // meta field type
        return buildCypherSelection(tailSelections.length === 0 ? initial.substring(initial.lastIndexOf(','), 1) : initial, tailSelections, variable, schemaType, resolveInfo);
    }
    const fieldType = schemaType.getFields()[fieldName].type;

    let inner = innerType(fieldType) ; // for target "type" aka label

    let fieldHasCypherDirective = schemaType.getFields()[fieldName].astNode.directives.filter((e) => {return e.name.value === 'cypher'}).length > 0;

    if (fieldHasCypherDirective) {

        let statement = schemaType.getFields()[fieldName].astNode.directives.find((e) => {
            return e.name.value === 'cypher'
        }).arguments.find((e) => {
            return e.name.value === 'statement'
        }).value.value;

        if (inner.constructor.name === "GraphQLScalarType") {

            return buildCypherSelection(initial + `${fieldName}: apoc.cypher.runFirstColumn("${statement}", ${cypherDirectiveArgs(variable, headSelection, schemaType)}, false)${tailSelections.length > 0 ? ',' : ''}`, tailSelections, variable, schemaType, resolveInfo);
        } else {
            // similar: [ x IN apoc.cypher.runFirstColumn("WITH {this} AS this MATCH (this)--(:Genre)--(o:Movie) RETURN o", {this: movie}, true) |x {.title}][1..2])

            let nestedVariable = variable + '_' + fieldName;
            let skipLimit = computeSkipLimit(headSelection);
            let fieldIsList = !!fieldType.ofType;

            return buildCypherSelection(initial + `${fieldName}: ${fieldIsList ? "" : "head("}[ x IN apoc.cypher.runFirstColumn("${statement}", ${cypherDirectiveArgs(variable, headSelection, schemaType)}, true) | x {${buildCypherSelection(``, headSelection.selectionSet.selections, nestedVariable, inner, resolveInfo)}}]${fieldIsList? "": ")"}${skipLimit} ${tailSelections.length > 0 ? ',' : ''}`, tailSelections, variable, schemaType, resolveInfo);
        }

    } else if (innerType(fieldType).constructor.name === "GraphQLScalarType") {
        return buildCypherSelection(initial + ` .${fieldName} ${tailSelections.length > 0 ? ',' : ''}`, tailSelections, variable, schemaType, resolveInfo);
    } else {
        // field is an object
        let nestedVariable = variable + '_' + fieldName,
            skipLimit = computeSkipLimit(headSelection),
            relationDirective = schemaType.getFields()[fieldName].astNode.directives.find((e) => {return e.name.value === 'relation'}),
            relType = relationDirective.arguments.find(e => {return e.name.value === 'name'}).value.value,
            relDirection = relationDirective.arguments.find(e => {return e.name.value === 'direction'}).value.value;

        let returnType = fieldType.toString().startsWith("[") ? returnTypeEnum.ARRAY : returnTypeEnum.OBJECT;

        return buildCypherSelection(initial + `${fieldName}: ${returnType === returnTypeEnum.OBJECT ? 'head(' : ''}[(${variable})${relDirection === 'in' || relDirection === 'IN' ? '<' : ''}-[:${relType}]-${relDirection === 'out' || relDirection === 'OUT' ? '>' : ''}(${nestedVariable}:${inner.name}) | ${nestedVariable} {${buildCypherSelection(``, headSelection.selectionSet.selections, nestedVariable, inner, resolveInfo)}}]${returnType === returnTypeEnum.OBJECT ? ')' : ''}${skipLimit} ${tailSelections.length > 0 ? ',' : ''}`, tailSelections, variable, schemaType, resolveInfo);
    }
}

function innerType (type) {
    return (type.ofType) ? innerType(type.ofType) : type;
}

function argumentValue(selection, name) {
    let arg = selection.arguments.find( (a) =>  a.name.value  === name)
    return arg === undefined ?  null : arg.value.value
}

function computeSkipLimit(selection) {
    let first=argumentValue(selection,"first");
    let offset=argumentValue(selection,"offset");

    if (first === null && offset === null ) return "";
    if (offset === null) return `[..${first}]`;
    if (first === null) return `[${offset}..]`;
    return `[${offset}..${parseInt(offset)+parseInt(first)}]`
}

export function parseArgs(args) {
    if (!args) {
        return {};
    }

    if (args.length === 0) {
        return {};
    }

    return args.reduce( (acc, arg) => {

        switch (arg.value.kind) {
            case "IntValue":
                acc[arg.name.value] = parseInt(arg.value.value);
                break;
            case "FloatValue":
                acc[arg.name.value] = parseFloat(arg.value.value);
                break;
            default:
                acc[arg.name.value] = arg.value.value;
        }

        return acc;
    }, {})
}

function getDefaultArguments(fieldName, schemaType) {
    // FIXME: check that these things exist

    try {
        return schemaType._fields[fieldName].args.reduce((acc, arg) => {
            acc[arg.name] = arg.defaultValue;
            return acc;
        }, {})
    } catch (err) {
        return {};
    }
}

export function cypherDirectiveArgs(variable, headSelection, schemaType) {
    const defaultArgs = getDefaultArguments(headSelection.name.value, schemaType)//{"this": variable};
    const schemaArgs = {}; // FIXME: what's the differenc between schemargs and defaultargs?
    const queryArgs = parseArgs(headSelection.arguments);

    let args = JSON.stringify(Object.assign(defaultArgs, queryArgs)).replace(/\"([^(\")"]+)\":/g," $1: ");

    return args === "{}" ? `{this: ${variable}${args.substring(1)}` : `{this: ${variable},${args.substring(1)}`

}