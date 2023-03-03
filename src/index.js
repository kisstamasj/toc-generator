#!/usr/bin/env node

import { Remarkable } from 'remarkable';
import toc from 'markdown-toc';
import fs from 'fs'
import indentString from 'indent-string';
import path from 'path';
import args from 'args'

args
  .option('file', 'The name of the md file with path (./mds/example.md)')
  .option('folder', './md/')
  .option('readmefile', './md/readme.md')

// console.log(process.argv)

var README_FILE = '';
const TOC_HEADER = '# Table of contents'

try {
    start()
} catch (err) {
    console.error(err);
}

function initReadme(customReadme = '')
{
    if(customReadme){
        README_FILE = customReadme;
    }

    fs.writeFileSync(README_FILE, '');
    var output = '';
    if (TOC_HEADER) {
        output = `${TOC_HEADER}\n`;
    }

    fs.writeFileSync(README_FILE, output);
}


function start() {

    if (process.argv.length === 2) {
        console.error('Expected at least one argument!');
        process.exit(1);
    }

    const flags = args.parse(process.argv)

    initReadme(flags.readmefile);

    if (flags.file) {
        if (!fs.lstatSync(flags.file).isFile()) {
            throw new Error(`${flags.file} is not a file`)
        }
        readFile(flags.file)
        return;
    }

    if (flags.folder) {
        console.log('-------------- Show files in folder --------------');
        fs.readdirSync(flags.folder, (err, files) => {
            files.forEach(file => {
                console.log(file);
            });
        });

        console.log('---------------------------------------------------');

        if (!fs.lstatSync(flags.folder).isDirectory()) {
            throw new Error(`${flags.folder} is not a directory`)
        }

        readFolder(flags.folder)

        return;
    }
}

function addFolderHeading(filePath)
{
    fs.appendFileSync(README_FILE, `\n## [${path.basename(filePath)}](${encodeURI(filePath)})\n\n`);
}

function readFolder(filePath){
    if(!filePath.endsWith('/')){
        filePath += '/';
    }

    const files = fs.readdirSync(filePath);
    addFolderHeading(filePath)
    files.forEach(file => {
        var fileWithPath = filePath+file

        if (fs.lstatSync(fileWithPath).isFile()) {
            readFile(fileWithPath)
        } else if(fs.lstatSync(fileWithPath).isDirectory()) {
            readFolder(fileWithPath+'/')
        }
    })
}

function render(str, options) {
    return new Remarkable()
        .use(toc.plugin(options)) // <= register the plugin
        .render(str);
}

function getBullet(lvl) {
    switch (lvl) {
        case 1: return '-';
        case 2: return '*';
        case 3: return '+';
        case 4: return '-';
        default: return '';
    }
}

function clearContentHeading(content){
    content = content.includes('(')
                ? content.substring(0, content.lastIndexOf("("))
                : content;

    content = content.includes('[')
                ? content.substring(content.indexOf('[') + 1, content.lastIndexOf("]"))
                : content;

    return content;
}

function makeElement(renderd, path) {
    var output = '';

    renderd.json.forEach((token, i) => {
        const lineEnd = i + 1 != renderd.length ? '\n' : '';
        const bullet = getBullet(token.lvl);
        const content = clearContentHeading(token.content)
        const str = `${bullet} [${content}](${encodeURI(path)}#${token.slug})${lineEnd}`;
        output += indentString(str, token.lvl, { indent: '  ' });
    })

    return output;
}

function readFile(filePath) {
    if (path.extname(filePath) != '.md') return;

    const data = fs.readFileSync(filePath, 'utf8');
    const renderd = render(data);
    fs.appendFileSync(README_FILE, makeElement(renderd, filePath));
}