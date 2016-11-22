#!/usr/bin/env node

var jp = require('jsonpath')
    , jsonfile = require('jsonfile')
    , fs = require('fs')
    , winston = require('winston')
    , options = require('yargs')
    .usage('\nCompiles componentized CloudFormation templates into a stand-alone file\n\nUsage: $0 [options] TEMPLATE')
    .help()
    .demand(1)

    .alias('o', 'out')
    .default('out', 'out.json')
    .describe('out', 'Name for compiled template')

    .alias('l', 'log-level')
    .default('log-level', 'info')
    .describe('log-level', 'error, warn, info, verbose, debug, silly')

    .alias('c', 'component-set')
    .describe('component-set', 'selects a set of component overrides')	

    .alias('h', 'help')
    .argv;

var log =  new winston.Logger({
    transports: [
        new (winston.transports.Console)({
            level: options.logLevel,
            colorize: true,
            prettyPrint: true,
        })
    ]});

log.debug('Options', JSON.stringify(options));

var inputFile = options._[0];
var outputFile = options.out;
var inputObject = jsonfile.readFileSync(inputFile);
var cset = options.componentSet;
var componentSets = ['default'];
if(options.componentSet) {
    log.verbose('Adding component set %s', cset)
    componentSets.push(cset);
    componentSets.reverse();
}
log.info('Component sets: %s', componentSets);

log.info('Processing template: %s', inputFile);
jp.nodes(inputObject, '$..Ref.URI').forEach(resolveRef, inputObject);
log.debug('Tada', inputObject);

jsonfile.writeFileSync(options.out, inputObject, {spaces: 4});

function  resolveRef(r) {
    log.info('Loading Component: %s', r.value);
    var component = jsonfile.readFileSync(findComponentPath(r.value));
    log.debug(component);

    jp.nodes(component, '$..Ref.URI').forEach(resolveRef, component);

    log.verbose('Build ref path');
    var path = jp.paths(this, '$..Ref.URI')[0];
    path.splice(-2, 2);
    path = jp.stringify(path);
    log.debug(path);

    log.verbose('Inserting component');
    var y =jp.value(this, path, component);
    //console.log(y);
    log.debug(this);

    return this;
}

function findComponentPath(ref) {
    log.verbose('Searching for component %s', ref);
    var cs = componentSets.find(function(s) {
        var path = ['components', s, this + '.json'].join('/');
        log.verbose('Checking path %s', path);

        var found = fs.existsSync(path);
        log.verbose(found?'Found it!':'Nope');
        return found;
    }, ref);
    log.verbose('Found component in set %s', cs);
    return ['components', cs, ref + '.json'].join('/');
}
