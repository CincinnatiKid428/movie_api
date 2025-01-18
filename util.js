// Function used to assess request params validation results with and return true if successful, false if errors present
const checkValidationResults = (validationErrors, res) => {
    if(!validationErrors.isEmpty()){
        console.error('Failed Validation - error with request parameter: ');
        console.error(validationErrors);
        res.status(400).send('Failed Validation - error with request parameter: \n'+JSON.stringify(validationErrors));
        return false;
    }
    return true;
}

module.exports = { checkValidationResults };