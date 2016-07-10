---
layout: post
title: "algorithm breakdown: point in polygon"
date: 2014-07-06 12:53:30 -0500
comments: true
categories: python GIS
---

Signed up for [Introduction to Data Science via Coursera](https://class.coursera.org/datasci-002), namely because the
list of projects looked pretty neat. Anyhow, tackled the first homework this weekend and while it was fairly 
straightforward python scripting, however one problem involved taking the [coordinates](https://dev.twitter.com/docs/platform-objects/tweets#obj-coordinates) from Twitter data and determining which US state the tweet originated from. We weren't
allowed to use any third party web-services so this task turned out to be a bit of work. After a bit of googling and 
data-munging I collected some [JSON data containing the bounding coordinates of each US state](https://gist.github.com/autodidacticon/0bd02192be24e08571c5). Then I found [this python code](http://geospatialpython.com/2011/01/point-in-polygon.html) for determining whether a point exists inside of polygon.
I went ahead and blindly implemented the algorithm and turned in the homework, but I made a mental note to come back to 
the code and _actually understand how it works_. At a high level, the algorithm uses the [Ray Casting](http://en.wikipedia.org/wiki/Ray_casting) method to project lines
 from the test point: if the line intercepts the polygon an __odd__ number of times, then the point is presumed to be 
__inside__ the polgyon, otherwise if the line intercepts the polygon an __even__ number of times, then the point is 
presumed to be __outside__ the polygon.

![Example](http://sidvind.com/images/a/aa/Jordan_curve_polygon.png)


So here is my version of the code with comments (assumes we're using the states' JSON dataset from above):
```python
def point_in_poly(x,y,poly):
    n = len(poly) #get the length of the bounding set to constrain the for loop
    inside = False #assume the point is outside the polygon

    p1x,p1y = poly[0]['x']), poly[0]['y']) #start with the first point
    for i in range(1, nx):
        p2x,p2y = poly[i]['x']), poly[i]['y']) #draw line segment to the next point
        if y > min(p1y,p2y): 
            if y <= max(p1y,p2y): #is the point vertically bounded by the line segment?
                if x <= max(p1x,p2x): #is the point horizontally bounded by the line segment?
                    if p1y != p2y:
                        xints = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x #solve for the x-intercept, point-slope form
                    if p1x == p2x or x <= xints:
                        inside = not inside
        p1x,p1y = p2x,p2y

    return inside
```

At first glance, most of this made sense except for `xints`; whats going on here? We're calculating the slope of the line
 given by `p2` and `p1` and then using that slope to calculate the x-intercept of the line passing through our test point.

```
y - y1 = m(x - x1)

let m = (y2 - y1 / x2 - x1)

substituting for m:
y - y1 = (y2 - y1 / x2 - x1) * (x - x1)

rearranging
(y - y1)(x2 - x1 / y2 - y1) = x - x1
 
finally
x = (y - y1)(x2 - x1 / y2 - y1) + x1
```
