---
layout: post
title: "Scraping Sherdog With Node.js"
date: 2014-12-27 15:22:04 -0600
comments: true
categories: [jsdom, node.js, npm, phantomjs, sherdog, ufc] 
---
[@bullardza](https://twitter.com/bullardza) challenged me to build an MMA prediction model. Coincidentally, I just finished [Coursera's Machine Learning course](https://www.coursera.org/course/ml), so this seems like an ideal first project. _Unfortunately data ingestion was not covered in the course_. While there are mature scraping frameworks available such as [BeautifulSoup](http://www.crummy.com/software/BeautifulSoup/) or [Nokogiri](http://www.nokogiri.org/), I've been meaning to increase my exposure to Node.js for sometime.

# High level approach
1. Open each event from Sherdog's [UFC](http://www.sherdog.com/organizations/Ultimate-Fighting-Championship-2) page.
2. From each [event](http://www.sherdog.com/events/UFC-184-Weidman-vs-Belfort-41893), retrieve each fighter's [data](http://www.sherdog.com/fighter/Chris-Weidman-42804) as text.
3. Parse text into structured data and load a datastore (mongo, rdbms, cassandra?)

###### First attempt: PhantomJS
I'd used PhantomJS before so _go with what you know_ seemed like a good approach. I used the [Phantom](https://www.npmjs.com/package/phantom) package as a wrapper to the PhantomJS API.

```coffeescript
phantom = require 'phantom'

phantom.create (ph) ->
  ph.createPage (page) ->
    page.open "http://www.sherdog.com/organizations/Ultimate-Fighting-Championship-2", (status) ->
      console.log "opened sherdog? ", status
# encapsulate functionality in setTimeout to allow content to load
      setTimeout( (-> 
# evaluate function and log output in callback
        page.evaluate((-> 
          urls = []
          $('table.event a[href]').each (i,e) -> urls.push(e.href)
          return urls), (result) ->
            console.log result[0]
            ph.exit())), 3000 )
```

Though JQuery was conveniently available from Sherdog's page, this script is a mess. All functionality must be encapsulated within a crude call to setTimeout to allow for the content to load, and even then, DOM interaction must first occur within a function passed to *evaluate* before finally being processed by a callback(s); this usage of chained callbacks appears to be unique to the Phantom wrapper [API](https://github.com/sgentle/phantomjs-node/wiki#evaluating-pages), it doesn't seem to exist in the PhantomJS core [API](http://phantomjs.org/api/webpage/method/evaluate.html). A framework seems awfully tempting at this point.

###### Second attempt: jsdom
Opted for a minimally featured environment or at the very least one that could guarantee a full page load after a successful request. Implementation of the initial plan was straightforward. [JSDom](https://github.com/tmpvar/jsdom) only exposes one real function *env* which handles script injection and a callback *done* which contains the crawling logic. A helper function (jsdominator!) was constructed to eliminate some of the boilerplate associated with the call to *env*.
```coffeescript
jsdom = require "jsdom"
_ = require "underscore"

event_urls = {}
fighter_urls = {}

jsdominator = (url,fn,scripts) ->
  require('jsdom').env
    url: url,
    scripts: scripts || ["http://code.jquery.com/jquery.js"],
    done: (e,w) ->
      fn.call e,w
      w.close()
  return

jsdominator "http://sherdog.com/organizations/Ultimate-Fighting-Championship-2",
  (e,w) ->
    $ = w.$
    $('table.event a[href]').each (i,e) ->
      event_urls[e.href] = false
    w.close()
    get_fighters_from event_urls
    return

get_fighters_from = (event_urls) ->
  for event in _.keys(event_urls)
    jsdominator event, 
      (e,w) ->
        if e
          return
        $ = w.$
        $('a[href ^= "/fighter"]').each (i,e) ->
          if not _.has fighter_urls, e.href
            fighter_urls[e.href] = false
                  
        event_urls[event] = true
        w.close()
        return
  return
```

The individual fighters' are now accessible and parsing their data is going to be an exercise in [JQuery](http://jquery.com) but the real question is, how are we going to model and store the data?
