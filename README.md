Template Compiler
=================

The AWS CloudFormation Template Compiler extends templates with the
capability to include shared template snippets called components.

Installation
------------

The compiler is based on Nodejs and should run fine on Windows, Mac and
Linux.

### nodejs

Install node from <https://nodejs.org/en/download/> which should include
`npm`

### compiler

In the github repository:

    $ cd $REPO/compiler
    $ npm install

Usage
-----

> **note**
>
> Currently the compiler is run from the `$REPO/compiler` directory. A
> real installer will be added in future work.

To compile a template with default settings using the server-type.json
component, do:

    $ ./compiler.js template.json 

You will now see a new template, `out.json`, that has the components
compiled in:

    $ cat out.json

You can get help with:

    $ ./compiler --help

Logging output is controlled with `--log-level`. Log levels are `error`,
`warn`, `info`, `verbose`, `debug`:

    $ ./compiler --log-level=debug template.json

You can set the name of the compiled template with `--out`:

    $ ./compiler --out=MySuperCoolTemplate.json template.json

Component sets allow you to override/replace some or all of the
components for a template. By default the compiler uses the default set.
To provide another set, use `--component-set`:

    $ ./compiler.js --component-set=super-duper template.json                                    
    info: Component sets: super-duper,default
    info: Processing template: template.json
    info: Loading Component: server-type
    info: Loading Component: allowed-values

In the output you can see that the compiler will first try loading each
component from super-duper then default. This allows a set to be sparse
i.e. provide only some of the needed components.

Coding templates
----------------

The new component reference syntax adds a `URI` object as the `Ref`
value in place of the normal string value:

    {"Ref": {"URI": "component"))

The `URI` is the component name minus any file extension, e.g. the file
`component.json` is just `component` for the `URI` value.

### Simple Example

Let's say you wanted to add a parameter called ServerType to your
template that let users choose the ECS instance type (size) at
provision-time. First, you would create a component file with the
parameter definition and save it to a file. Let's call it
\`server-type.json\`:

    {
       "Description": "EC2 instance type",
       "Type": "String",
       "Default": "t2.medium",
       "AllowedValues": [
           "t2.micro",
           "t2.medium",
           "m3.medium",
           "m3.large",
           "m3.xlarge",
           "m3.2xlarge"
       ]
    }

Then you would add a reference to your template that points to your new
component:

    {
       "AWSTemplateFormatVersion": "2010-09-09",
       "Description": "a simple Linux EC2 instance.",
       "Metadata": {...},
       "Parameters": {
           "ServerType": {
               "Ref": {"URI": "server-type"}
           }
       },
       "Mappings": {...},
       "Resources": {...},
       "Outputs": {...}
    }

Notice the value of `URI` is the file name minus the extension. After
you compile, the output template will now have your component embedded:

    {
       "AWSTemplateFormatVersion": "2010-09-09",
       "Description": "a simple Linux EC2 instance.",
       "Metadata": {},
       "Parameters": {
           "ServerType": {
               "Description": "EC2 instance type",
               "Type": "String",
               "Default": "t2.medium",
               "AllowedValues": [
                   "t2.micro",
                   "t2.medium",
                   "m3.medium",
                   "m3.large",
                   "m3.xlarge",
                   "m3.2xlarge"
               ]
           }
       },
       "Mappings": {},
       "Resources": {},
       "Outputs": {}
    }

### Nested Component Example

The compiler also allows components to be nested. Let's take our
server-type component and factor out the list of `AllowedValues`:

    {
       "Description": "EC2 instance type",
       "Type": "String",
       "Default": "t2.medium",
       "AllowedValues": {
           "Ref": {
               "URI": "allowed-values"}
       }
    }

And now we will create another component (in file allowed-values.json)
with just the list of values:

    [
       "t2.micro",
       "t2.medium",
       "m3.medium",
       "m3.large",
       "m3.xlarge",
       "m3.2xlarge"
    ]

After compilation the allowed-values component will be embedded into the
server-type component which will be embedded into our template. You may
nest component as deeply as you like. However, be careful to *not create
circular references*. Checks for cycles in the reference graph may be
added in the future but do not yet exist.
