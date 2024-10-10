document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    const pageSummaryButton = document.getElementById("pageSummaryButton");
    const addLinkButton = document.getElementById("addLinkButton");
    const loginSection = document.getElementById("loginSection");
    const afterLoginSection = document.getElementById("afterLoginSection");
    const linksListContainer = document.getElementById("linksListContainer");
    const linksList = document.getElementById("linksList");
    const deleteLinksButton = document.getElementById("deleteLinksButton");
    const chatLinksButton = document.getElementById("chatLinksButton");

    const addLinkModal = document.getElementById("addLinkModal");
    const closeModal = document.querySelector(".close-modal");
    const linkNameInput = document.getElementById("linkName");
    const linkText = document.getElementById("linkText");
    const saveLinkButton = document.getElementById("saveLinkButton");

    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton"); 
    const chatBox = document.getElementById("chatBox"); 

    const settingsContainer = document.getElementById("settingsContainer"); // Reference the settings container
    const popupFooter = document.getElementById("popupFooter");


    const settingsIcon = document.getElementById("settingsIcon");
    const settingsMenu = document.getElementById("settingsMenu");
    const deleteAccountButton = document.getElementById("deleteAccountButton");

    const backButton = document.getElementById("backBtn")


    let currentTabUrl = "";

    function getCsrfToken(callback) {
        chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "csrftoken" }, function(cookie) {
            if (cookie) {
                callback(cookie.value);
            } else {
                console.error("CSRF token not found.");
                callback(null);
            }
        });
    }


    // Toggle settings menu on settings icon click
    settingsIcon.addEventListener("click", function () {
        settingsMenu.style.display = settingsMenu.style.display === "block" ? "none" : "block";
    });

    // Handle click outside the settings menu to close it
    document.addEventListener("click", function (event) {
        if (!settingsContainer.contains(event.target)) {
            settingsMenu.style.display = "none";
        }
    });



    backButton.addEventListener("click", function() {
        console.log("Back button clicked."); // This should log when the button is clicked

        // Hide the chat section and show the after login section
        document.getElementById("chatSection").style.display = "none";
        document.getElementById("afterLoginSection").style.display = "block";

        // Call the function to fetch and display the links again
        fetchAndDisplayLinks();
    });
    

    // Handle Delete Account button click
    deleteAccountButton.addEventListener("click", function () {
        const confirmation = confirm("Are you sure you want to delete the account? This action cannot be undone.");
    
        if (confirmation) {
            // Get the CSRF token from the cookie
            chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "csrftoken" }, function (csrfCookie) {
                if (csrfCookie) {
                    const csrfToken = csrfCookie.value;
    
                    // Get the user email from the cookie
                    chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "user_email" }, function (emailCookie) {
                        if (emailCookie) {
                            const userEmail = emailCookie.value;
    
                            // Make the API call to delete the account
                            fetch("http://127.0.0.1:8000/api/users/delete_account/", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": csrfToken, // Add the CSRF token here
                                },
                                body: JSON.stringify({ email: userEmail })
                            })
                            .then(response => {
                                if (response.status === 200) {
                                    alert('Account deleted successfully.');
    
                                    // Log out the user after account deletion
                                    chrome.cookies.remove({ url: "http://127.0.0.1:8000", name: "user_first_name" }, function() {
                                        chrome.cookies.remove({ url: "http://127.0.0.1:8000", name: "user_email" }, function() {
                                        if (loginSection) loginSection.style.display = "flex";
                                        if (afterLoginSection) afterLoginSection.style.display = "none";
                                        if (chatSection) chatSection.style.display = "none";
                                        if (popupFooter) popupFooter.style.display = "none"; // Hide settings on logout
                                        if (linksList) linksList.innerHTML = ''; // Clear the list on logout

                                        const pageSummaryButton = document.getElementById("pageSummaryButton");
                                        const addLinkButton = document.getElementById("addLinkButton");
                                        const settingsContainer = document.getElementById("settingsContainer");

                                        if (pageSummaryButton) pageSummaryButton.style.display = "none";
                                        if (addLinkButton) addLinkButton.style.display = "none";
                                        if (settingsContainer) settingsContainer.style.display = "none";
                                        });
                                    });
                                } else {
                                    throw new Error('Failed to delete account.');
                                }
                            })
                            .catch(error => console.error('Error deleting account:', error));
                        } else {
                            alert("User email not found. Please log in.");
                        }
                    });
                } else {
                    alert("CSRF token not found. Please log in.");
                }
            });
        } else {
            console.log("Account deletion cancelled by user.");
        }
    });
    
    function fetchAndDisplayLinks() {
        // Get the CSRF token and session ID from cookies if needed
        chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "csrftoken" }, function(csrfCookie) {
            chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "sessionid" }, function(sessionCookie) {
                if (csrfCookie && sessionCookie) {
                    const csrfToken = csrfCookie.value;
                    const sessionId = sessionCookie.value;
    
                    // Get the user email from the cookie
                    chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "user_email" }, function(emailCookie) {
                        if (emailCookie) {
                            const userEmail = emailCookie.value;
                            const encodedEmail = encodeURIComponent(userEmail);
    
                            // Perform the GET request to fetch the links
                            fetch(`http://127.0.0.1:8000/api/links/user_links?email=${encodedEmail}`, {
                                method: 'GET',
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": csrfToken,
                                    "Cookie": "sessionid=" + sessionId
                                }
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return response.json();
                            })
                            .then(data => {
                                linksList.innerHTML = ''; // Clear the list
                                data.forEach(link => {
                                    const listItem = document.createElement('li');
                                    listItem.innerHTML = `
                                        <input type="checkbox" class="link-checkbox" data-link-id="${link.id}" data-link-url="${link.link}">
                                        <span>Name: ${link.name} <br> Link: <a href="${link.link}" target="_blank">${link.link}</a></span>
                                    `;
                                    linksList.appendChild(listItem);
                                });
                            })
                            .catch(error => console.error('Error fetching links:', error));
                        } else {
                            console.error("User email not found in cookies.");
                        }
                    });
                } else {
                    console.error("CSRF token or session ID not found.");
                }
            });
        });
    }
    

    deleteLinksButton.addEventListener("click", function () {
        // Capture the selected links' IDs
        const selectedLinkCheckboxes = document.querySelectorAll('.link-checkbox:checked');
        const linkIds = Array.from(selectedLinkCheckboxes).map(checkbox => checkbox.dataset.linkId);
        console.log(linkIds)
        if (linkIds.length > 0) {
            // Get the CSRF token and make the request
            getCsrfToken(function(csrfToken) {
                if (csrfToken) {
                    fetch('http://127.0.0.1:8000/api/links/delete_links/', {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrfToken, // Include the CSRF token in the request
                        },
                        body: JSON.stringify({ link_ids: linkIds })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error('Failed to delete selected links.');
                        }
                    })
                    .then(data => {
                        alert('Selected links deleted successfully.');
                        selectedLinkCheckboxes.forEach(checkbox => checkbox.closest('li').remove());
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while deleting links.');
                    });
                } else {
                    alert("CSRF token is required to delete links.");
                }
            });
        } else {
            alert('Please select at least one link to delete.');
        }
    });
    // Event listener for Chat Using Selected button
    chatLinksButton.addEventListener("click", function () {
        const selectedLinks = Array.from(document.querySelectorAll('.link-checkbox:checked')).map(checkbox => checkbox.dataset.linkUrl);
        const selectedLinkCheckboxes = document.querySelectorAll('.link-checkbox:checked');
        const selectedLinkIds = Array.from(document.querySelectorAll('.link-checkbox:checked')).map(checkbox => checkbox.dataset.linkId);

        selectedLinkCheckboxes.forEach(checkbox => {
            console.log(checkbox.dataset.link);  // This should log the value of data-link for each selected checkbox
        });
        if (selectedLinks.length > 0) {
            if (selectedLinks.length > 0) {
                // Display a loading message
        const selectedLinksList = document.getElementById('selectedLinksList');
        selectedLinksList.innerHTML = '<li>Building context... Please wait.</li>';

        // Get the user email from cookies
        chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "user_email" }, function (emailCookie) {
            if (emailCookie) {
                const userEmail = emailCookie.value;

                // Get the CSRF token and then make the POST request
                getCsrfToken(function(csrfToken) {
                    if (csrfToken) {
                        // Prepare the payload
                        const payload = {
                            link_ids: selectedLinkIds,
                            email: userEmail
                        };

                        // Make the POST API call
                        fetch('http://127.0.0.1:8000/api/context/create_context/', {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrfToken, // Include the CSRF token in the request
                            },
                            body: JSON.stringify(payload)
                        })
                        .then(response => {
                            if (response.ok) {

                                return response.json();
                            } else {
                                throw new Error('Failed to start chat.');
                            }
                        })
                        .then(data => {
                            // On success, hide the after login section and show the chat section
                            afterLoginSection.style.display = "none";
                            chatSection.style.display = "block";
                            const contextId = data.context_id; // Assuming 'Context' contains the context ID
                            console.log('Context ID:', contextId);

                            // Store the contextId in local storage
                            localStorage.setItem('contextId', contextId);

                            // Populate the selected links in the collapsible section
                            selectedLinksList.innerHTML = ''; // Clear loading message
                            selectedLinks.forEach(link => {
                                const listItem = document.createElement('li');
                                listItem.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
                                selectedLinksList.appendChild(listItem);
                            });

                            // Set up collapsible functionality
                            const collapsible = document.querySelector('.collapsible');
                            const content = document.querySelector('.collapsible-content');

                            collapsible.addEventListener('click', function () {
                                this.classList.toggle('active');
                                content.style.display = content.style.display === "block" ? "none" : "block";
                            });

                        })
                        .catch(error => {
                            console.error('Error starting chat:', error);
                            alert('An error occurred while starting the chat.');
                        });
                    } else {
                        alert("CSRF token is required to start the chat.");
                    }
                });
            } else {
                alert("User email not found. Please log in.");
            }
        });
    } else {
        alert('Please select at least one link to chat.');
    }
}
    });

 
    
    sendButton.addEventListener("click", function () {
        const message = chatInput.value.trim();
        
        if (message) {
            // Display the user's message in the chat box
            const userMessageElement = document.createElement('div');
            userMessageElement.textContent = message;
            userMessageElement.classList.add('chat-message', 'user-message');
            chatBox.appendChild(userMessageElement);
    
            chatInput.value = ''; // Clear the input field
            chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
    
            // Disable the send button and show a loading indicator
            sendButton.disabled = true;
            const loadingElement = document.createElement('div');
            loadingElement.textContent = "AI is typing...";
            loadingElement.classList.add('chat-message', 'loading-message');
            chatBox.appendChild(loadingElement);
            chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
    
            // Now send the message to the backend and handle the AI response
            const contextId = localStorage.getItem('contextId');
    
            if (contextId) {
                // Get the CSRF token (assuming getCsrfToken function is defined)
                getCsrfToken(function(csrfToken) {
                    if (csrfToken) {
                        // Prepare the payload
                        const payload = {
                            context_id: contextId,
                            user_input: message
                        };
    
                        // Make the POST API call to send the user message and get AI response
                        fetch('http://127.0.0.1:8000/api/context/chat/', {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRFToken": csrfToken,
                            },
                            body: JSON.stringify(payload)
                        })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error('Failed to send message.');
                            }
                        })
                        .then(data => {
                            // Remove the loading indicator
                            chatBox.removeChild(loadingElement);
    
                            const aiResponse = data.ai_response; // Assuming 'ai_response' is the key
    
                            // Display the AI's response in the chat box
                            const aiMessageElement = document.createElement('div');
                            aiMessageElement.textContent = aiResponse;
                            aiMessageElement.classList.add('chat-message', 'ai-message');
                            chatBox.appendChild(aiMessageElement);
    
                            // Scroll to the bottom to show the latest AI response
                            chatBox.scrollTop = chatBox.scrollHeight;
                        })
                        .catch(error => {
                            console.error('Error sending message:', error);
                            alert('An error occurred while sending the message.');
                        })
                        .finally(() => {
                            // Re-enable the send button after receiving the response
                            sendButton.disabled = false;
                        });
                    } else {
                        alert("CSRF token is required to send the message.");
                    }
                });
            } else {
                alert("Context ID not found. Please start a new chat session.");
            }
        }
    });
    

    // Event listener for login button
    loginButton.addEventListener("click", function () {
        const loginUrl = 'http://127.0.0.1:8000/api/users/get_google_sso/';
        window.open(loginUrl); // Redirect to the Google SSO login page
    });

    // Event listener for logout button
    logoutButton.addEventListener("click", function () {
        chrome.cookies.remove({ url: "http://127.0.0.1:8000", name: "user_first_name" }, function() {
            chrome.cookies.remove({ url: "http://127.0.0.1:8000", name: "user_email" }, function() {
                loginSection.style.display = "flex";
                afterLoginSection.style.display = "none";
                footerButtons.style.display = "none";
                addLinkModal.style.display = "none"
            });
        });
        localStorage.removeItem('contextId');
    });

    // Event listener for Page Summary button
    pageSummaryButton.addEventListener("click", function () {
        // Disable the button to prevent multiple clicks
        pageSummaryButton.disabled = true;
        pageSummaryButton.textContent = "Generating Summary...";

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            const currentUrl = currentTab.url;
            const pageTitle = currentTab.title;

            getCsrfToken(function(csrfToken) {
                if (csrfToken) {
                    chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "sessionid" }, function(sessionCookie) {
                        if (sessionCookie) {
                            const sessionId = sessionCookie.value;

                            fetch('http://127.0.0.1:8000/api/context/page_summary/', {
                                method: 'POST',
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": csrfToken,
                                },
                                body: JSON.stringify({ 
                                    link: currentUrl,
                                    sessionid: sessionId
                                })
                            })
                            .then(response => {
                                if (response.ok) {
                                    return response.json();
                                } else {
                                    // Parse the error response
                                    return response.json().then(errorData => {
                                        throw new Error(errorData.error || 'Failed to get page summary.');
                                    });
                                }
                            })
                            .then(data => {
                                // Create and show a modal with the summary
                                showSummaryModal(pageTitle, data.ai_response);
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                showSummaryModal("Error", error.message);
                            })
                            .finally(() => {
                                // Re-enable the button
                                pageSummaryButton.disabled = false;
                                pageSummaryButton.textContent = "Page Summary";
                            });
                        } else {
                            showSummaryModal("Error", "Session ID not found. Please log in.");
                        }
                    });
                } else {
                    showSummaryModal("Error", "CSRF token is required to get the page summary.");
                }
            });
        });
    });

    function showSummaryModal(title, content) {
        // Create modal elements
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: #fefefe; padding: 20px; border: 1px solid #888;
            width: 80%; max-width: 500px; max-height: 80%; overflow-y: auto;
        `;

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;
        `;
        closeBtn.onclick = function() { document.body.removeChild(modal); };

        const titleElement = document.createElement('h2');
        titleElement.textContent = title;

        const contentElement = document.createElement('p');
        contentElement.textContent = content;

        // Assemble the modal
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(contentElement);
        modal.appendChild(modalContent);

        // Add the modal to the document
        document.body.appendChild(modal);
    }

    addLinkButton.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            currentTabUrl = currentTab.url;
            linkText.textContent = "Link: " + currentTabUrl;
            addLinkModal.style.display = "block";
        });
    });

    saveLinkButton.addEventListener("click", function () {
        const linkName = linkNameInput.value;

        // Get the CSRF token and session ID from cookies
        chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "csrftoken" }, function(csrfCookie) {
            chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "sessionid" }, function(sessionCookie) {
                if (csrfCookie && sessionCookie) {
                    const csrfToken = csrfCookie.value;
                    const sessionId = sessionCookie.value;
                    console.log('csrf',csrfToken)
                    console.log('sessionId',sessionId)
                    
                    // Get the user email from the cookie
                    chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "user_email" }, function(emailCookie) {
                        if (emailCookie) {
                            const userEmail = emailCookie.value;

                            // Make the API call with CSRF token and session ID
                            fetch("http://127.0.0.1:8000/api/links/save_user_link/", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": csrfToken,
                                },
                                body: JSON.stringify({
                                    name: linkName,
                                    link: currentTabUrl,
                                    email: userEmail
                                })
                            })
                            .then(response => {
                                if (response.status === 201) {
                                    return response.json();  // If 201, parse the response as JSON
                                } else if (response.status === 400) {
                                    throw new Error('Bad Request: The server could not process the request.');
                                } else {
                                    throw new Error('Unexpected error occurred.');
                                }
                            })
                            .then(data => {
                                alert('Link saved successfully!');
                                addLinkModal.style.display = "none";
                                linkNameInput.value = ""; // Clear the input field
                                fetchAndDisplayLinks();
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert(error.message);  // Display the error message from the catch block
                            });
                        } else {
                            alert("User email not found. Please log in.");
                        }
                    });
                } else {
                    alert("CSRF token or session ID not found. Please log in.");
                }
            });
        });
    });
    

    closeModal.addEventListener("click", function () {
        addLinkModal.style.display = "none";
    });
    // Close button
    document.querySelector(".close-btn").addEventListener("click", function () {
        window.close(); // Close the popup
    });

    // Function to read cookies and update UI
    function readUserCookies() {
        chrome.cookies.get({ url: "http://127.0.0.1:8000", name: "user_first_name" }, function (cookie) {
            if (cookie) {
                const userName = cookie.value;
                document.getElementById("userName").textContent = userName;
                loginSection.style.display = "none";
                afterLoginSection.style.display = "block";
                footerButtons.style.display = "flex"; // Show buttons when logged in
                fetchAndDisplayLinks();
            } else {
                loginSection.style.display = "flex";
                afterLoginSection.style.display = "none";
                footerButtons.style.display = "none"; // Hide buttons when logged out
            }
        });
    }

    // Initialize the popup by reading the cookies
    readUserCookies();
});

