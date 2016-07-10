---
layout: post
title: "Conway's Game of Life in Coffeescript"
date: 2015-02-22 15:01:05 -0600
comments: true
categories: [coffeescript, underscore.js, Conway's Game of Life]
---

I went to a [Coderetreat](http://coderetreat.org) a few months ago and the theme was [Conway's Game of Life](http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). This is a classic demonstration of how a simple two-dimensional [cellular automaton](http://en.wikipedia.org/wiki/Cellular_automaton) can produce complexity. Outside of immediate entertainment, the latent purpose of this exercise was to improve at [Coffeescript](http://coffeescript.org). But enough name dropping, the first implementation was as follows:

```coffeescript
_ = require('underscore')

class Conway
  constructor: (@length) ->
    @cells = new Array(@length ** 2)
    _.each @cells, (e, i, l) ->
      e = Math.round(Math.random())
      l[i] = e
  
  neighbors = (index) =>
    _.compact([@cells[index - @length - 1], @cells[index - @length], @cells[index - @length + 1], @cells[index - 1], @cells[index + 1], @cells[index + @length - 1], @cells[index + @length], @cells[index + @length + 1]]).length

  alive = (cell, num_neighbors) ->
    if num_neighbors == 3 or(cell and num_neighbors == 2) then 1 else 0

  play: () =>
    while true
      _.map @cells, (e, i, l) =>
        n = neighbors i
        alive e, n

      ((cell) => console.log(@cells[cell...cell+@length])) cell for cell in @cells by @length

c = new Conway 16
c.play()
```

Briefly, this implementation aimed to accomplish the following:  
    1. Constructs an array of cells  
    2. For each cell, it counts the number of 'living neighbors'
    3. For all cells, it applies Conway's rules simultaneously:  
      a. If the number of living neighbors is < 2 then the cell dies (underpopulation)  
      b. If the number of living neighbors is > 3 then the cell dies (overpopulation)  
      c. If the number of living neighbors is 2 or 3 then the cell lives  
      d. If the cell is dead and the number of living neighbors == 3 then the cell is alive (reproduction)   
    4. Displays the updated array row by row. 

Upon execution in the terminal, the following error message was displayed:
```
➜  cgol git:(master) ✗ coffee cgol.coffee
TypeError: Cannot read property '-2' of undefined
  at neighbors (/Users/rm022526/git/cgol/cgol.coffee:11:23)
  at /Users/rm022526/git/cgol/cgol.coffee:19:13
  at Function._.map._.collect (/usr/local/lib/node_modules/underscore/underscore.js:164:24)
  at Conway.play (/Users/rm022526/git/cgol/cgol.coffee:18:9)
  at Conway.play (/Users/rm022526/git/cgol/cgol.coffee:1:1)
  at Object.<anonymous> (/Users/rm022526/git/cgol/cgol.coffee:25:3)
  at Object.<anonymous> (/Users/rm022526/git/cgol/cgol.coffee:1:1)
  at Module._compile (module.js:460:26)
```

*Wut.* The 'neighbors' function was declared with the [fat arrow](http://coffeescript.org/#fat-arrow) meaning it should be bound to the **this** right? The compiled javascript indicates otherwise:
```javascript
    neighbors = function(index) {
      return _.compact([Conway.cells[index - Conway.length - 1], Conway.cells[index - Conway.length], Conway.cells[index - Conway.length + 1], Conway.cells[index - 1], Conway.cells[index + 1], Conway.cells[index + Conway.length - 1], Conway.cells[index + Conway.length], Conway.cells[index + Conway.length + 1]]).length;
    };
```
It appears that in the context of the private function *neighbors* **cells** are being called as if they were static properties of the **Conway** object, which they are not. As it turns out the fat arrow is the problem because **neighbors**, as a private method, is in the scope of the **Conway** object which Coffeescript binds to **this**. What happens if the single arrow is used? Make the change and execute....
```
➜  cgol git:(master) ✗ coffee cgol.coffee
TypeError: Cannot read property 'NaN' of undefined
  at neighbors (/Users/rm022526/git/cgol/cgol.coffee:11:23)
  at /Users/rm022526/git/cgol/cgol.coffee:19:13
  at Function._.map._.collect (/usr/local/lib/node_modules/underscore/underscore.js:164:24)
  at Conway.play (/Users/rm022526/git/cgol/cgol.coffee:18:9)
  at Conway.play (/Users/rm022526/git/cgol/cgol.coffee:1:1)
  at Object.<anonymous> (/Users/rm022526/git/cgol/cgol.coffee:25:3)
  at Object.<anonymous> (/Users/rm022526/git/cgol/cgol.coffee:1:1)
  at Module._compile (module.js:460:26)
``` 
This appears to be negative progress. **this** is now resolving to the **global** namespace which is definitely wrong. At this point the shortcomings of javascript with regards to private members are becoming clear. There is however a fix, *neighbors* may be called with **call( this, args )** with **this** being the instance of the Conway object. This might be considered hackish, but its functional. Note: **apply** could also have been used; differences explained [here](http://stackoverflow.com/questions/1986896/what-is-the-difference-between-call-and-apply/1986909#1986909).

```coffeescript
_ = require('underscore')

class Conway
  constructor: (@length) ->
    @cells = new Array(@length ** 2)
    _.each @cells, (e, i, l) ->
      e = Math.round(Math.random())
      l[i] = e
  
  neighbors =  (index) ->
    _.compact([@cells[index - @length - 1], @cells[index - @length], @cells[index - @length + 1], @cells[index - 1], @cells[index + 1], @cells[index + @length - 1], @cells[index + @length], @cells[index + @length + 1]]).length

  alive = (cell, num_neighbors) ->
    if num_neighbors == 3 or (cell and num_neighbors == 2) then 1 else 0

  play: () =>
    while true
      _.map @cells, (e, i, l) =>
        n = neighbors.call this, i
        alive e, n

      ((cell) => console.log(@cells[cell...cell+@length])) cell for cell in @cells by @length

c = new Conway 16
c.play()
```

Execution now gives us a screen full of 1's and 0's. Success.  

Looking over the Conway class, [underscore](http://underscorejs.org) seems out of place. Coffeescript's provided list comprehensions should suffice to replace these calls to underscore's *each* and *map*. Final revision:
```coffeescript
class Conway
  constructor: (@length) ->
    @cells = new Array(@length ** 2)
    @cells = (Math.round(Math.random()) for cell in @cells)
  
  neighbors =  (index) ->
    (cell for cell in [@cells[index - @length - 1], @cells[index - @length], @cells[index - @length + 1], @cells[index - 1], @cells[index + 1], @cells[index + @length - 1], @cells[index + @length], @cells[index + @length + 1]] when cell == 1).length

  alive = (cell, num_neighbors) ->
    if num_neighbors == 3 or(cell and num_neighbors == 2) then 1 else 0

  play: () =>
    while true
      @cells = (alive(cell, neighbors.call(this, i)) for cell, i in @cells)
      ((cell) => console.log(@cells[cell...cell+@length])) cell for cell in @cells by @length

c = new Conway 16
c.play()
```
