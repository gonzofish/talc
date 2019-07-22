#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const args = [...process.argv].slice(2);
const runDir = path.resolve(__dirname, '..', 'lib');

spawn('node', [runDir].concat(args), { stdio: 'inherit' });
