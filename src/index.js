const dotenv = require('dotenv');
const axios = require('axios');
const { DateTime } = require('luxon');

dotenv.config();
const apiKey = process.env.OPEN_AI_KEY;

const timeEndPoint = (location) =>
  'http://worldtimeapi.org/api/timezone/' + location;

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey,
});

function getCurrentWeather(location, unit = 'fahrenheit') {
  console.log('getCurrentWeather =>', location, unit);
  if (location.toLowerCase().includes('tokyo')) {
    return JSON.stringify({
      location: 'Tokyo',
      temperature: '10',
      unit: 'celsius',
    });
  } else if (location.toLowerCase().includes('san francisco')) {
    return JSON.stringify({
      location: 'San Francisco',
      temperature: '72',
      unit: 'fahrenheit',
    });
  } else if (location.toLowerCase().includes('paris')) {
    return JSON.stringify({
      location: 'Paris',
      temperature: '22',
      unit: 'fahrenheit',
    });
  } else {
    return JSON.stringify({ location, temperature: 'unknown' });
  }
}

async function lookUpTime(location) {
  try {
    const response = await axios.get(timeEndPoint(location));
    const { datetime } = response.data;
    const dateTimeObj = DateTime.fromISO(datetime, { setZone: true });
    // Format the time while keeping the original timezone
    const timeString = dateTimeObj.toLocaleString(DateTime.TIME_WITH_SECONDS);
    return JSON.stringify({
      time: timeString,
    });
  } catch (err) {
    console.log(err.message);
    return JSON.stringify({
      error: err.message,
    });
  }
}

async function main() {
  const messages = [
    { role: 'system', content: 'you are a helpful assistant' },
    { role: 'user', content: 'what time is it in paris?' },
    { role: 'user', content: 'what is the weather in paris?' },
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'lookUpTime',
        description: 'Get the current time from specified location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description:
                'the location, e.g rome should be written as europe/rome',
            },
          },
          required: ['location'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getCurrentWeather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'the location that we want the weather from',
            },
            unit: {
              type: 'string',
              description: 'the matrix to measure the temperature',
              enum: ['celsius', 'fahrenheit'],
            },
          },
          required: ['location'],
        },
      },
    },
  ];
  const model = 'gpt-4o';
  const tool_choice = 'auto';

  const response = await openai.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice,
  });

  const responseMessage = response.choices[0].message;

  if (responseMessage.tool_calls) {
    const toolCalls = response.choices[0].message.tool_calls;

    const availableFunctions = {
      lookUpTime: lookUpTime,
      getCurrentWeather: getCurrentWeather,
    };

    //extend conversation
    messages.push(responseMessage);

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const functionResponse = await functionToCall(functionArgs.location);

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: functionName,
        content: functionResponse,
      }); //extend conversation

      console.log(functionResponse);
    }
    console.log(messages);
    const secondResponse = await openai.chat.completions.create({
      model,
      messages,
    });

    console.log(secondResponse.choices);
  }
}

main()
  .then(() => {
    console.log('completed');
  })
  .catch((err) => console.log(err));
