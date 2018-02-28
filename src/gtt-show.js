const _ = require('underscore');

const fs = require('fs');

const program = require('commander');

const moment = require('moment');

const Cli = require('./include/cli');

const Config = require('./include/file-config');

const Owner = require('./models/owner');

const User = require('./models/user');

const Project = require('./models/project');

const IssueCollection = require('./models/issueCollection');

// this collects options
function collect(val, arr) {
    if (!arr) { arr = [] }

    arr.push(val);

    return _.uniq(arr);
}

// set options
program
    .arguments('[username]')
    .option('-s --scope <scope>', 'set scope of retrieved issues: all, created-by-me, assigned-to-me')
    .option('-t --state <state>', 'only retrieve issues matching the state: opened, closed')
    .option('--verbose', 'show verbose output like exceptions')
    .parse(process.argv);

// init helpers
let config = new Config(process.cwd());

let cli = new Cli(program.args);

// overwrite config with args and opts
config
    .set('username', cli.username())
    .set('scope', program.scope)
    .set('state', program.state)
    .set('quiet', program.quiet)
    .set('_verbose', program.verbose);

Cli.quiet = config.get('quiet');
Cli.verbose = config.get('_verbose');

if (!config.get('username')) {
    Cli.error(`Please specify a username to retrieve all matching issues`);
} else {
}

Cli.list(`Loading all issues for user ${config.get('username')}`);
new Promise((resolve, reject) => {
    let owner = new Owner(config);

    owner.authorized()
        ['catch'](e => Cli.x('Invalid access token', e))
        .then(() => {
            let user = new User(config);

            user.make(config.get('username'))
                ['catch'](e => Cli.x('Could not initialize user', e))
                .then(() => {
                    let issues = new IssueCollection(config);

                    issues.all()
                        ['catch'](e => Cli.x('Could not gather issues', e))
                        .then((issues_collected) => {
                            Cli.mark();
                            _.each(issues_collected, (issue) => {
                                let project = new Project(config);
                                project.make(issue.project_id)
                                    ['catch'](e => Cli.x('Could not retrieve project information'))
                                    .then(() => {
                                        Cli.print(`${project.name} ${issue}`);
                                    });
                            });
                        });
                });
        });
})
    .then(() => Cli.done());
