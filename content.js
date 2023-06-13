const fieldMappings = [
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:first-child > td:nth-child(2)', destination: '#drawingNumber' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:first-child > td:nth-child(4)', destination: '#sheetId' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:first-child > td:nth-child(5)', destination: '#revision' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(2) td:nth-child(5)', destination: '#suppCode' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(2) td:nth-child(7)', destination: '#otherSys' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(2) td:nth-child(4)', destination: '#airplaneModelComboboxInput' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(3) td:nth-child(5) a', destination: '#priorityComboboxInput' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(3) td:nth-child(4)', destination: '#disclosureValueComboboxInput' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(1) td:nth-child(12) span select option:checked', destination: '#sitePerformingLocComboboxInput' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(3) td:nth-child(6) input', destination: '#customerRequestDate' },
    { source: 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:first-child td:nth-child(16)', destination: '#customerRequestTime' },
];

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#copyFields');
    if (button) {
        button.addEventListener('click', copyFields);
    }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.command === 'getSourceFields') {
        const sourceFields = {};
        fieldMappings.forEach((mapping) => {
            const sourceElement = document.querySelector(mapping.source);
            if (sourceElement) {
                let value = sourceElement.textContent.trim();

                // handle #priorityComboboxInput to format text to captialize first letter
                if (mapping.destination === '#priorityComboboxInput') {
                    value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                }

                // Handle the conditional mapping for the specific source field
                if (mapping.source === 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(1) td:nth-child(12) span select option:checked') {
                    if (value === 'S') {
                        value = 'ST LOUIS';
                    } else if (value === 'A') {
                        value = 'SEATTLE';
                    } else if (value === 'E') {
                        value = 'EVERETT';
                    }
                }

                // Handle the conditional mapping if #suppCode is empty
                if (mapping.destination === '#suppCode' && !value) {
                    mapping.source = 'table#bodyTable tr:not([style*="display: none"]) > td:first-child > table tr:nth-child(1) td:nth-child(14)'
                }

                // Handle the conditional mapping if disclosureValueComboboxInput contains COM
                if (mapping.destination === '#disclosureValueComboboxInput' && value.includes('COM')) {
                    value = 'COM';
                } else if (mapping.destination === '#disclosureValueComboboxInput' && value.includes('MIL')) {
                    value = 'MIL';
                }

                // Handle the date and time splitting
                if (mapping.destination === '#customerRequestTime') {
                    const [dateString, timeString] = value.split(' ');
                    console.log('time value', value);
                    if (mapping.destination === '#customerRequestTime') {
                        value = timeString;
                    }
                }
                // testing
                if (mapping.destination === '#customerRequestDate') {
                    console.log('date value', value);
                }

                sourceFields[mapping.destination] = value;
            }
        });
        sendResponse({ sourceFields });
    } else if (message.command === 'setDestinationFields') {
        const { destinationFields } = message;
        fieldMappings.forEach((mapping) => {
            const destinationElement = document.querySelector(mapping.destination);
            if (destinationElement && destinationFields[mapping.destination]) {
                // Set the value of dropdown fields by selecting the corresponding option
                if (destinationElement.tagName === 'SELECT') {
                    const selectedIndex = Array.from(destinationElement.options).findIndex(option => option.value === destinationFields[mapping.destination]);
                    if (selectedIndex !== -1) {
                        destinationElement.selectedIndex = selectedIndex;

                        // Dispatch a change event for dropdown fields
                        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                        destinationElement.dispatchEvent(changeEvent);
                    }
                } else {
                    destinationElement.value = destinationFields[mapping.destination];
                }

                // Dispatch an input event to simulate user input
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                destinationElement.dispatchEvent(inputEvent);
            }
        });
    }
});