# Collidoscope
 A Synthesizer coded in HTML/JS handling MIDI inputs.

 I tried to make a replica of this synthesizer I found on youtube: https://www.youtube.com/watch?v=9XMfKYVu_fg using only html, js and nodejs.
 
 The nodejs server is running locally while the html page is open to detect MIDI inputs when plugging a synthesizer by USB.
 
 When a MIDI controller is detected, the js is informed by websockets and nodejs keeps updating pressed keys on the synthesizer.
