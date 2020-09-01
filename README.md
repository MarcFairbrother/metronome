# Metronome

This is a metronome built with vanilla JS (ES6+), HTML and CSS.

## Project setup

No build steps, just simple JS, HTML and CSS files.

## Metronome default settings and limits

All of the default settings used on page load are defined in the HTML form.

The minimum and maximum values for both the tempo and number of beats to play for each bar are also defined in the corresponding range inputs.

## Audio

Uses the web audio API to play clicks for each beat. Each click's frequency is different depending on whether it's the first click of the bar, an offbeat, or another beat.

Several methods were tested:
* Creating and destroying a new oscillator for each click produced performance issues, especially on Chrome.
* Using a single oscillator and modifying its frequency before playing each click worked on desktop browsers but on Safari iPadOS, the frequency change was audible as the click was played.
* Using three oscillators set to different frequencies and turning the gain up and down to produce the click sound worked best.

## Recursion vs setInterval

Recursion is used with a promise-based wait function instead of setInterval to enable updating the tempo without clearing and reinitialising the interval.