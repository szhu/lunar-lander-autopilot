<p align="center">

<img width="500" alt="Edwin Morris’s Lunar Lander, with autopilot added by Sean Zhu" src="https://user-images.githubusercontent.com/1570168/224214709-8983622e-e70c-4c95-9ab2-4ca97ea21a51.png">

</p>

This is a fork of [ehmorris/lunar-lander](https://github.com/ehmorris/lunar-lander), with an autopilot added.

Do you enjoy playing the lander game but think it's too hard? Or perhaps you want to get the satisfaction of landing well without actually doing any of the work?

Let [~100 lines of autopilot code](./autopilot.js) perform a perfect landing for you every time!

<https://user-images.githubusercontent.com/1570168/224213713-fb3ae806-d568-4df3-b837-66c66634d9a6.mov>

---

<details><summary>Expand to see <a href="ehmorris/https://github.com/ehmorris/lunar-lander">lunar-lander</a>'s README</summary>

# About

A plain JavaScript, HTML, and CSS game with no dependencies.

Code and design: Edwin Morris

Music and sound: Max Kotelchuck

Thanks to [this guide](http://students.cs.ucl.ac.uk/schoolslab/projects/HT5/) for help with the basics.

# Running

Deployed to ehmorris.com via a git submodule.

See `launch.json` for running.

---

### Game Ideas

- Daily challenge
- Move mobile booster controls to one side so they're easier to tap?
- Add rings / bonus point areas to hit before landing
- Make terrain land-able
- Generate a shareable image. Show stats in-canvas.

### Extras

- "Mad dog" mode: start with very high rotation rate
- Confetti when grazing the bottom, or exceeding certain speeds
- Konami code on desktop?
- Use broadcast channel to make a second screen a big dashboard of controls and graphs

### Refactor

- Move end-game logic into index
- Move landed and crashed data objects into state
- Sort out underscores - are they needed? Bit of clutter

### Bugs

- Press a finger in the center, then press another and move it to the left. The center touch is cancelled. This is a touchmove regression, probably due to the touches array.
- Make play speed consistent regardless of frame rate
  - On some screens the refresh rate is 120, on others 60. This changes the speed of play. The game is twice as fast on a new MacBook as on an iPhone. The animations are procedural, so to accomplish this, forces like thrust and gravity will have to be modified based on time elpased between frames. Unsure how to do this.
  - The gameplay target is the experience on a MacBook with a 120hz refresh rate. Phones could possibly be slower, or shorter screens in general - but this should be controlled and not incidental
- iOS safari "from" banner cuts off bottom of canvas

</details>
