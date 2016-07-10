---
vlayout: post
title: "Writing all the things; reading all the instructions"
date: 2014-09-28 11:14:29 -0500
comments: true
categories: meta heroku ruby
---
Forward resolution, at the risk of serious navel gazing, write down all new learnings.


Today, pushed the site to [Heroku](http://heroku.com) via `git push -f heroku master` (force pushed some history rewrites, had accidentally included all of the [Octopress](http://octopress.org) [development](https://github.com/imathis/octopress) commits to [this site's repository](http://github.com/autodidacticon/blog); gross). The following was the output from the [Heroku deployment task](https://devcenter.heroku.com/articles/git#deploying-code):
```
Fetching repository, done.
Counting objects: 4, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 244 bytes | 0 bytes/s, done.
Total 2 (delta 1), reused 0 (delta 0)

-----> Ruby app detected
-----> Compiling Ruby/Rack
-----> Using Ruby version: ruby-2.1.2
-----> Installing dependencies using 1.6.3
       Running: bundle install --without development:test --path vendor/bundle --binstubs vendor/bundle/bin -j4 --deployment
       Using bundler 1.6.3
       Using tilt 1.3.7
       Using rack 1.5.2
       Using rack-protection 1.5.0
       Using sinatra 1.4.2
       Your bundle is complete!
       Gems in the groups development and test were not installed.
       It was installed into ./vendor/bundle
       Bundle completed (0.48s)
       Cleaning up the bundler cache.
-----> Writing config/database.yml to read from DATABASE_URL
       Could not detect rake tasks
       ensure you can run `$ bundle exec rake -P` against your app with no environment variables present
       and using the production group of your Gemfile.
       This may be intentional, if you expected rake tasks to be run
       cancel the build (CTRL+C) and fix the error then commit the fix:
       rake aborted!
       cannot load such file -- stringex
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/Rakefile:3:in `require'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/Rakefile:3:in `<top (required)>'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/rake_module.rb:25:in `load'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/rake_module.rb:25:in `load_rakefile'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:637:in `raw_load_rakefile'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:94:in `block in load_rakefile'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:165:in `standard_exception_handling'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:93:in `load_rakefile'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:77:in `block in run'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:165:in `standard_exception_handling'
       /tmp/build_7b05d802-9257-4663-b332-ca259a129676/vendor/ruby-2.1.2/lib/ruby/2.1.0/rake/application.rb:75:in `run'
       vendor/ruby-2.1.2/bin/rake:37:in `<main>'

###### WARNING:
       No Procfile detected, using the default web server (webrick)
       https://devcenter.heroku.com/articles/ruby-default-web-server

-----> Discovering process types
v       Procfile declares types -> (none)
       Default types for Ruby  -> console, rake, web

-----> Compressing... done, 13.4MB
-----> Launching... done, v12
       http://richardmoorhead.herokuapp.com/ deployed to Heroku

To git@heroku.com:richardmoorhead.git
 + 13bbd10...e7ec084 master -> master (forced update)
```

`Could not detect rake tasks`

**tldr**: [bug](https://github.com/imathis/octopress/issues/1601); added `Rakefile` to `.slugignore` (TODO: what is [.slugignore](https://devcenter.heroku.com/articles/slug-compiler#ignoring-files-with-slugignore)?)

So, what does `bundle exec rake -P` mean? From `bundle -h`:
```
bundle exec(1) bundle-exec.1.html
              Execute a script in the context of the current bundle
```
Where the current bundle is the application's [Gemfile](http://bundler.io/gemfile.html). The rest, from `rake -h`:
```
 -P, --prereqs                    Display the tasks and dependencies, then exit.
```
So wait, why is Heroku attempting to execute the tasks in the Rakefile? From the [docs](https://devcenter.heroku.com/articles/ruby-support#general-support-process-types) and this [bug](https://github.com/imathis/octopress/issues/1439) it appears that this is [erroneous](https://github.com/imathis/octopress/issues/1601). 

Next issue: 
```
###### WARNING:
       No Procfile detected, using the default web server (webrick)
       https://devcenter.heroku.com/articles/ruby-default-web-server
```

**tldr**: added `gem unicorn` to Gemfile, added/modified `config\unicorn.rb`

This is a straightforward case of a fire-and-forget, [copy-paste deployment](http://octopress.org/docs/deploying/heroku/). [WEBrick](http://www.ruby-doc.org/stdlib-1.9.3/libdoc/webrick/rdoc/WEBrick.html) is a single threaded server and is not suitable for production use; any traffic this site would have got would certainly have to wait. Fortunately the output listed the [appropriate instructions](https://devcenter.heroku.com/articles/ruby-default-web-server), from which I made the following changes:
```ruby
# config/unicorn.rb
worker_processes Integer(ENV["WEB_CONCURRENCY"] || 3)
timeout 15
preload_app true


before_fork do |server, worker|
  Signal.trap 'TERM' do
    puts 'Unicorn master intercepting TERM and sending myself QUIT instead'
    Process.kill 'QUIT', Process.pid
  end
# Commenting these lines out because we're not using Rails/ActiveRecord
#  defined?(ActiveRecord::Base) and
#    ActiveRecord::Base.connection.disconnect!
end

after_fork do |server, worker|
  Signal.trap 'TERM' do
    puts 'Unicorn worker intercepting TERM and doing nothing. Wait for master to send QU#IT'
  end
# Commenting these lines out because we're not using Rails/ActiveRecord
#  defined?(ActiveRecord::Base) and
#    ActiveRecord::Base.establish_connection
end
```

```ruby
#Procfile
web: bundle exec unicorn -p $PORT -c ./config/unicorn.rb
```