window.onload = function () {

  const myNumberInput = document.getElementById("myNumberInput");

  myNumberInput.addEventListener("input", function () {
    // Remove any leading zeros
    this.value = this.value.replace(/^0+/, '');
  });

  const myForm = document.querySelector('#form');

  myForm.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent the form from submitting

    const submitBtn = document.getElementById("submit-button");
    // submitBtn.innerHTML = 'File is being Processed, It will take A while...';
    submitBtn.disabled = true;
    submitBtn.classList.add("hidden");
    const spinner = document.createElement("img");
    spinner.src = "../images/fileIsBeingProcessed.gif";
    spinner.id = "loading-spinner";
    spinner.style.height = "150px"; // Set height to 50px
    spinner.style.width = "150px";// Set width to 50px
    spinner.style.borderRadius = "50px"
    submitBtn.parentNode.insertBefore(spinner, submitBtn.nextSibling);

    const formData = new FormData(myForm); // create a new FormData object from the form data
    const data = new URLSearchParams(formData);
    const url = 'http://localhost:8080/submit'; // get the API endpoint URL from the form action attribute

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data, // set the request body to the FormData object
    })
      .then((response) => response.json())
      .then((responseData) => {
        const responseDataData = responseData.data; // get the 'data' field from the response data
        console.log(responseDataData);
        const csvContent = convertToCSV(responseDataData); // convert data to CSV format
        downloadCSV(csvContent); // prompt user to download CSV file
        spinner.remove();
        submitBtn.classList.remove("hidden");
        // submitBtn.innerHTML = 'Start Downloading Csv';
        submitBtn.disabled = false;
      })
      .catch((error) => console.error(error));
  });
}

function convertToCSV(data) {
  const header = Object.keys(data[0]).join(',') + '\n'; // create header row from object keys
  const rows = data.map(obj => Object.values(obj).join(',')).join('\n'); // create rows from object values
  return header + rows;
}

function downloadCSV(content) {
  const filename = prompt('Please enter a filename for the CSV file and Open it from your default download directory:', 'data.csv');
  if (filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' }); // create blob from content
    const link = document.createElement('a'); // create link element
    link.href = URL.createObjectURL(blob); // set link href to blob URL
    link.download = filename; // set link download attribute to filename
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click(); // click link to trigger download
    document.body.removeChild(link); // remove link from document
  }
}
