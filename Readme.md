##Thoughtspot Lake Challenge

To begin, clone this repo to your local drive. If you haven't installed Node.js, you'll need to do that.
I recommend using Homebrew: `brew install node`.

Then run `npm install` to install the project dependencies.

###Data
You may supply a CSV of Z values in equal length rows, in the main project directory, named data.csv.
The coordinate system in use numbers them (x,y) with (0,0) in the upper left - the absolute value of quadrant IV on a cartesian plane.

If you do not wish to supply a CSV, you may copy an array into run.js, or otherwise edit the source to accommodate your format.

###Running the program
Enter `npm start` at the terminal to run the program. It will parse the CSV, and then ask you for a water level, gradient, and start and end points. The result will be displayed.

###Tests
This project users Mocha and Chai for testing; enter `npm test` to run the tests.