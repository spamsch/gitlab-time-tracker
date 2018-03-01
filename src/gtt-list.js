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
const Table = require('cli-table');

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

                    issues.all(user.id, config.get('state'), config.get('scope'))
                        ['catch'](e => Cli.x('Could not gather issues', e))
                        .then((issues_collected) => {
                            config.set('issues', _.sortBy(issues_collected, 'project_id'));
                            resolve();
                        });
                });
        });
    })
    .then(() => {
        Cli.mark();
        if (config.get('issues') === undefined) {
            Cli.error('Did not find any issues matching your criteria');
        }
    })
    .then(() => new Promise((resolve) => {
        // for each issue we need project information to make the output meaningful
        let projectIdsToLoad = _.uniq(_.map(config.get('issues'), (i) => i.project_id));
        Promise.all(_.map(projectIdsToLoad, (projectid) => {
            let promise = new Promise((resolve, reject) => {
                let project = new Project(config);
                project.make(projectid)
                    ['catch'](e => Cli.x('Could not retrieve project'))
                    .then(() => resolve(project));
            });
            return promise;
        }))
        .then((projects) => {
            config.set('projects', Object.assign({}, ...projects.map((item) => ({[item.id] : item})) ));
            resolve();
        });
    }))
    .then(() => {
        // combine projects with issues found
        let table = new Table({
          style : {compact : true, 'padding-left' : 1}
        });
        _.each(config.get('issues'), (issue) => {
            table.push([issue.title.green + "\n" + issue.data.web_url.gray, issue.created_at.format('MMM D'), config.get('projects')[issue.project_id].name]);
        });
        Cli.print(table.toString());
    })
    .then(() => Cli.done());
