//the originial serverless@2
// 'use strict';

// const AWS = require('aws-sdk');
// const documentClient = new AWS.DynamoDB.DocumentClient({   region: "us-east-1", 
//   maxRetries: 3, 
//   httpOptions: {
//   timeout: 5000
// } 
// });
// const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;
// const send = (statusCode, data) => {
//   return {
//     statusCode: statusCode,
//     body: JSON.stringify(data)
//   }
// }

// module.exports.createNote = async (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;
//   let data;
//   try {
//     data = JSON.parse(event.body);
//   } catch (parseError) {
//     console.error('Error parsing JSON:', parseError);
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ message: "Invalid JSON input", error: parseError.toString() }),
//     };
//   }

//   try {
//     const params = {
//       TableName: NOTES_TABLE_NAME,
//       Item: {
//          notesId: data.id,
//          title: data.title,
//          body: data.body
//       },
//       ConditionExpression: "attribute_not_exists(notesId)"
//     };

//     await documentClient.put(params).promise();
//     callback(null, send(201, data))
//   } catch (error) {
//     callback(null, send(500, error.message))
//   }
// };
// module.exports.updateNote = async (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;
//   let notesId = event.pathParameters.id;
//   let data = JSON.parse(event.body);
//   try {
//     const params = {
//       TableName: NOTES_TABLE_NAME,
//       Key: { notesId },
//       UpdateExpression: 'set #title = :title, #body = :body',
//       ExpressionAttributeNames: {
//         '#title': 'title',
//         '#body': 'body'
//       },
//       ExpressionAttributeValues: {
//         ':title': data.title,
//         ':body': data.body
//       },
//       ConditionExpression: 'attribute_exists(notesId)'
//     }
//     await documentClient.update(params).promise();
//     callback(null, send(200, data))
//   } catch(error) {
//     callback(null, send(500, error.message))
//   }
// };

// module.exports.deleteNote = async (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;
//   let notesId = event.pathParameters.id;
//   try {
//     const params = {
//       TableName: NOTES_TABLE_NAME,
//       Key: { notesId },
//       ConditionExpression: 'attribute_exists(notesId)'
//     }
//     await documentClient.delete(params).promise();
//     callback(null, send(200, notesId))
//   } catch (error) {
//     callback(null, send(500, error.message))
//   }
// };

// module.exports.getAllNotes = async (event, context, callback) => {
//   context.callbackWaitsForEmptyEventLoop = false;
//   try {
//     const params = {
//       TableName: NOTES_TABLE_NAME,
//     }
//     const notes = await documentClient.scan(params).promise()
//     callback(null, send(200, notes))
//   } catch(error) {
//     callback(null, send(500, error.message))
//   }
// };


'use strict';

const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand
 } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDB({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode: statusCode,
    body: JSON.stringify(data)
  }
}

module.exports.createNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const data = JSON.parse(event.body);
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
         notesId: data.id,
         title: data.title,
         body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    };

    await ddbDocClient.send(new PutCommand(params))
    return send(201, data)
  } catch (error) {
    console.error('Create Note Error:', {
      errorMessage: error.message,
      requestId: error.$metadata ? error.$metadata.requestId : null,
      stack: error.stack
    });
    return send(500, { message: "Internal Server Error" })
  }
};
module.exports.updateNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body'
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }
    await ddbDocClient.send(new UpdateCommand(params))
    return send(200, data)
  } catch(error) {
    console.error('Update Note Error:', {
      errorMessage: error.message,
      requestId: error.$metadata ? error.$metadata.requestId : null,
      stack: error.stack
    });
    return send(500, { message: "Internal Server Error" });
  }
  };

module.exports.deleteNote = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: 'attribute_exists(notesId)'
    }
    await ddbDocClient.send(new DeleteCommand(params));
    return send(200, notesId)
  } catch (error) {
    console.error('Delete Note Error:', {
      errorMessage: error.message,
      requestId: error.$metadata ? error.$metadata.requestId : null,
      stack: error.stack
    });
    return send(500, { message: "Internal Server Error" })
  }
};

module.exports.getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    }
    const notes = await ddbDocClient.send(new ScanCommand(params));
    return send(200, notes)
  } catch(error) {
    console.error('Get Notes Error:', {
      errorMessage: error.message,
      requestId: error.$metadata ? error.$metadata.requestId : null,
      stack: error.stack
    });
    return send(500, { message: "Internal Server Error" })
  }
};


