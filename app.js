// const fs = require('fs');
// var path = require("path");
const express = require('express');
const cors = require('cors');
const app = express();
// const { Parser } = require('json2csv');
const bodyParser = require('body-parser');
const { remote } = require('webdriverio');

// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('private'))


app.get('/', (req, res) => {
    res.sendFile(__dirname + "/private/index.html")
})

app.post('/submit', (req, res) => {
    console.log("")
    const { url, startingRollNo, endingRollNo } = req.body;

    console.log('yooo==========', url, startingRollNo, endingRollNo)
    try {
        (async () => {
            const results = [];
            for (let i = startingRollNo; i <= endingRollNo; i++) {
                const browser = await remote({
                    capabilities: {
                        browserName: 'chrome',
                        'goog:chromeOptions': {
                            args: ['--headless', '--disable-gpu']
                        }
                    },
                });
                await browser.url(url);
                const rollNumberInput = await browser.$('input[name="roll_no"]');
                await rollNumberInput.waitForExist();
                await rollNumberInput.setValue(String(i));

                const getResultButton = await browser.$('input[name="submitcontact"]');
                await getResultButton.click();
                const pageContents = await browser.$$('div.pagecontents');
                // console.log(await Promise.all(pageContents.map((el) => el.getText())));
                const result = await Promise.all(pageContents.map((el) => el.getText()))
                const noSpaces = result[0].replace(/\s+/g, '');
                // console.log('hehehehehe===========',noSpaces)
                if (noSpaces.includes('ResultsSomeErrors')) {
                    console.log(`Skipping roll number ${i}`);
                    await browser.deleteSession();
                    continue;
                }

                const rollNo = noSpaces.match(/RollNo\.(\d+)/i)[1];

                const name = noSpaces.match(/Name(.+?)FatherName/i)[1].replace(/([A-Z])/g, ' $1').trim();

                const fatherName = noSpaces.match(/FatherName(.+?)RegistrationNo/i)[1].replace(/([A-Z])/g, ' $1').trim();

                const registrationNo = noSpaces.match(/RegistrationNo.(\d+-ctl-\d+)/i)[1];

                // console.log(noSpaces)

                // let cgpa;
                // if (noSpaces.includes('(PrvFailin')) {
                //     // Without Spaces
                //     const cgpaMatch = noSpaces.match(/TOTALCGPA(\d+\.\d+\(.*?\))Back/i);
                //     const extractedCgpa = cgpaMatch[1];
                //     cgpa = extractedCgpa;
                // } else {
                //     cgpa = Number(noSpaces.match(/CGPA([\d.]+)/i)[1]);
                // }

                let cgpa;
                if (noSpaces.includes('(PrvFailin')) {
                    // Without Spaces
                    const cgpaMatch = noSpaces.match(/TOTALCGPA\s*(\d+\.\d+)\s*\(.*?\)\s*Back/i);
                    const extractedCgpa = cgpaMatch[1];
                    cgpa = extractedCgpa;
                } else {
                    cgpa = Number(noSpaces.match(/CGPA\s*([\d.]+)/i)[1]);
                }


                let Degree = noSpaces.match(/Degree(.*?\d+)/)[1].replace(/RollNo.*$/, '').replace(/Name.*$/, '').trim().replace(/`/g, "'");
                Degree = Degree.replace(/`s/g, "s "); // Replacing "`s" with "s " to form "Bachelor's Studies"
                Degree = Degree.replace(/([a-z])([A-Z])/g, "$1 $2"); // Inserting space between words

                // const NameOfInstitution = noSpaces.match(/SEMESTER CREDIT HOURS.*?\n(.*)\d/)[1].replace(/\d/, '').trim();
                const regex = /NameofInstitutionSEMESTERCREDITHOURSGPA(.+?)\d+/;
                const match = noSpaces.match(regex);
                let nameOfInstitution = match ? match[1] : null;
                nameOfInstitution = nameOfInstitution.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/,/g, ' ');

                const semesterCreditHour = Number(noSpaces.match(/SEMESTERCREDITHOURSGPAGovernmentGraduateCollege,Township,Lahore(\d+)/i)[1]);

                // Creating an object with the extracted fields
                const data = {
                    rollno: rollNo,
                    Name: name,
                    FatherName: fatherName,
                    RegistrationNo: registrationNo,
                    CGPA: cgpa,
                    Degree: Degree,
                    NameOfInstitution: nameOfInstitution,
                    SemesterCreditHour: semesterCreditHour
                };
                // console.log(data);
                results.push(data)
                await browser.deleteSession();
            }
            // console.log(results)

            try {
                if (results) {
                    res.status(200).json({
                        data: results
                    });
                } else {
                    res.status(400).json({
                        message: 'Cannot convert',
                    });
                }
            } catch (err) {
                console.error(err);
            }
        })();
    } catch (e) {
        console.log(e);
    }

});

let port = 8080;


function startServer(port) {
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying the next one...`);
            startServer(port + 1);
        } else {
            console.error(err);
        }
    });
}

startServer(port)