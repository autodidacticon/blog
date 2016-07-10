---
layout: post
title: "zsh: no matches found: install[readify]"
date: 2014-06-28 11:30:14 -0500
comments: true
categories: [octopress, ruby, rake, zsh]
---
Only appropriate that the first post is about difficulties setting up the blog. Encountered this while setting up 
[Octopress](http://octopress.org/docs/setup) I went through the documentation [here](http://octopress.org/docs/setup/) 
and installed the dependencies but decided I wanted a different theme. For whatever reason, I went with [Readify](https://github.com/vladigleba/readify).
When I attempted `rake install['readify']` I received the following 
```bash
zsh: no matches found: install[readify]
```
What does this mean? Trivial googling produced the following solution:
```bash
#add the following alias to your .zshrc
alias rake = 'noglob rake'
```
Oh ok, this works, but why? Well, first what's *noglob* mean? What does *glob* mean? [Globbing](http://en.wikipedia.org/wiki/Glob_(programming))
 is the general reference to
the pattern matching performed by the shell, eg. 'ls *txt'. 

So what was happening when I originally executed `rake install['readify']`? As it turns out zsh was interpreting the 
brackets as [globbing operators](http://zsh.sourceforge.net/Doc/Release/Expansion.html#Glob-Qualifiers) and treating 
`['readify']` as a [character class](http://www.regular-expressions.info/charclass.html).
This is not to say globbing and regular expressions are the same thing; globbing is generally less powerful than pure 
Regex but zsh's globbing is [pretty awesome](http://www.refining-linux.org/archives/37/ZSH-Gem-2-Extended-globbing-and-expansion/).

Anyhow, other solutions include

```bash
rake "install['readify']" #double quotes produce a string literal and disable globbing
```
or
```bash
rake install\['readify'\] #escape the brackets so they are interpreted literally
```

or use [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) and enable the rake plugin (best solution).
```bash
plugins=(git rails ruby heroku rake)
```
