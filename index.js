#!usr/bin/env node

const {textSync} = require('figlet');
const {prompt} = require('inquirer');
const {get} = require('axios');
const {createSpinner} = require('nanospinner');
const g = require('gradient-string');
const grad = g('#1475C2', '#72ACDA');
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const num = (n) => BigInt(n).toString();
const s = (n) => (n > 1 ? 's' : '');

let score = 0,
    questions = 0;
require('colors');

async function welcome() {
    console.clear();
    console.log(grad(textSync('Trivli')));
    const spinner = createSpinner('Loading game...').start();
    await sleep(2000);
    spinner.success();
    await sleep(500);
    console.clear();
    console.log(`
                         ${grad('How to play')}

Each turn, I will ask you a question. Whenever you choose an
incorrect answer,  I will take away a point from your score. 
If you get the correct one, I will give you a point.  Sounds
simple, right?
    `);
    await prompt({
        name: 'start',
        message: 'Press enter to start',
        type: 'input'
    });
    console.clear();
}

async function askName() {
    const {name} = await prompt({
        name: 'name',
        message: 'What is your name?',
        type: 'input',
        default: 'Player'
    });

    return name;
}

async function askCont() {
    const {cont} = await prompt({
        name: 'cont',
        message: 'Do you want to continue?',
        type: 'confirm',
        default: true
    });

    return cont;
}

async function ask(message, choices) {
    const {ans} = await prompt({
        name: 'ans',
        message,
        type: 'list',
        choices
    });

    return ans;
}

function decodeData(data) {
    return Object.keys(data).reduce((a, b) => {
        a[b] = Array.isArray(data[b])
            ? data[b].map(decodeURIComponent)
            : decodeURIComponent(data[b]);

        return a;
    }, {});
}

function formatData(data) {
    data = decodeData(data);
    data.answers = data.incorrect_answers
        .concat(data.correct_answer)

        .sort(() => Math.random() - 0.5);
    return data;
}

async function handleAns(ans, correct, name) {
    const spinner = createSpinner('Checking answers...').start();
    await sleep(750);
    if (ans === correct) {
        spinner.success();
        console.log(
            `${name.yellow}${', you got the correct answer!'.green}`.green
        );
        score++;
    } else {
        spinner.error();
        console.log(
            `${name.yellow}${
                ', you did not get the correct answer. The correct answer was '
                    .red
            }${correct.yellow}`
        );
        score--;
    }

    console.log(`Your current score: ${num(score).yellow}`);
}

async function over(name) {
    console.clear();
    console.log(grad(textSync('Game Over')));
    console.log(
        `Thanks for playing, ${name.yellow}! Your final score is ${
            BigInt(score).toString().yellow
        } with ${num(questions).yellow} question${s(questions)} answered!`
    );
}

async function main() {
    let cont = true;
    await welcome();
    const name = await askName();
    while (cont) {
        console.clear();
        questions++;
        let {data} = await get(
            'https://opentdb.com/api.php?amount=1&encode=url3986&type=multiple'
        );
        data = formatData(data.results[0]);
        const ans = await ask(data.question, data.answers);
        await handleAns(ans, data.correct_answer, name);
        cont = await askCont();
    }
    over(name, questions);
}

main();
