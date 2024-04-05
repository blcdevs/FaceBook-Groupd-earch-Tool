// Import necessary modules
const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();

// Use body-parser to parse JSON requests
app.use(bodyParser.json());

// Define the API endpoint to handle both POST and GET requests
app.all('/searchGroups', async (req, res) => {
  // Log the request body received by the server
  console.log('Request Body:', req.body);

  // Get the request parameters from the request body
  const { town, radius, minMembers, privacy } = req.body;

  // Check if any of the required parameters is missing
  if (!town || !radius || !minMembers || !privacy) {
    return res.status(400).json({ error: 'Missing parameters in the request' });
  }

  // Construct the URL to search for Facebook groups
  const url = `https://www.facebook.com/search/groups/?q=${encodeURIComponent(town)}&epa=${radius}&type=group&privacy=${privacy}`;

  // Make a request to the URL
  request(url, async (error, response, html) => {
    try {
      if (error) {
        throw new Error('Error occurred while fetching data from Facebook: ' + error);
      }

      // Parse the HTML response
      const $ = cheerio.load(html);

      // Initialize an object to store the groups
      const groups = {};

      // Get all the group elements
      const groupElements = $('div[role="feed"] > div[role="article"]');

      // Log the number of group elements found
      console.log('Number of group elements found:', groupElements.length);

      // Iterate over the group elements
      groupElements.each((i, element) => {
        // Get the group details
        const groupName = $(element).find('a[role="link"]').text();
        const groupLink = $(element).find('a[role="link"]').attr('href');
        const membersCount = $(element).find('span[aria-label="Members"]').text().replace(/[^\d,]/g, '');
        const groupPrivacy = 'Private'; // Assuming all groups are private

        // Log the group details for debugging
        console.log('Group Name:', groupName);
        console.log('Group Link:', groupLink);
        console.log('Members Count:', membersCount);

        // Check if the group meets the criteria
        if (parseInt(membersCount) >= minMembers && groupPrivacy === 'Private') {
          // Add the group to the object
          groups[groupName] = {
            link: groupLink,
            membersCount: membersCount,
            privacy: groupPrivacy
          };
        }
      });

      // Log the results to the console
      console.log('---------------------------------------------------------');
      console.log('Facebook Group Search Results:');
      console.log(`Found ${Object.keys(groups).length} private Facebook groups in ${town} with at least ${minMembers} members within a ${radius}-mile radius.`);
      console.log('---------------------------------------------------------');

      // Format the groups data for the response
      const formattedGroups = [];
      for (const [groupName, group] of Object.entries(groups)) {
        formattedGroups.push({
          name: groupName,
          link: group.link,
          membersCount: group.membersCount,
          privacy: group.privacy
        });
      }

      // Return the list of groups in the response
      res.json({ groups: formattedGroups });
    } catch (err) {
      // Log the error
      console.error('Error occurred while fetching data from Facebook: ', err);

      // Return an error response
      res.status(500).json({ error: 'Error occurred while fetching data from Facebook' });
    }
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
