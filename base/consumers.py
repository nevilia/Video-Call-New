import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'Test-Room' #assume that there is only one room called test-room
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        print('Disconnected')
        
    async def receive(self, text_data):
        receive_dict = json.loads(text_data)
        message = receive_dict['message']
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {                           #send.message is a string corresponding to the name of the function
                'type': 'send.message', #compulsory, send_message is a function that the consumer will use while sending the message to each peer
                'message':message
            }
        )
        
    async def send_message(self, event):
        message = event['message'] #serialized dict
        
        await self.send(text_data = json.dumps({ #converting python to json
            'message' : message
        }))