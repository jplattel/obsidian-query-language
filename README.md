# Obsidian Query Language 

This is a plugin for Obsidian (https://obsidian.md) that allows you to query your notes and gather information about your vault inside a note itself. 

## Installation

Clone this repository in the `.obsidian/plugins` folder and enable it in the settings of Obsidian. 

## Working with the plugin & examples

You can query your vault with a `oql` code block, for example:

````markdown
```oql
name: Daily notes
query: "'100 Daily/'"
output: "{name}: {count}"
```
````

This little block in a note renders to an output, counting the notes in the `100 Daily` folder and returns a output that renders as: `Daily notes: 100` in the case you have 100 daily notes. This is just a basic way of querying your vault. More in depth examples soon!

Check out the [extended search docs from Fuse](https://fusejs.io/examples.html#extended-search) to figure out how to query your own vault.

## How does this plugin work?

It builds a parallel index using [Fuse](https://fusejs.io/) that you can query for data!