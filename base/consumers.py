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
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        print('Disconnected')
        
    async def receive(self, text_data):
        receive_dict = json.loads(text_data)
        message = receive_dict['message']
        action = receive_dict['action']
        
        if (action == 'new=offer' or 'new-answer'):
            receiver_channel_name = receive_dict['message']['receiver_channel_name']
            receive_dict['message']['receiver_channel_name'] = self.channel_name
            
            await self.channel_layer.send(
            receiver_channel_name,
            {                           #send.message is a string corresponding to the name of the function
                'type': 'send.sdp', #compulsory, send_message is a function that the consumer will use while sending the message to each peer
                'receive_dict':receive_dict
            }
        )
            
            return
        
        receive_dict['message']['receiver_channel_name'] = self.channel_name
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {                           #send.message is a string corresponding to the name of the function
                'type': 'send.sdp', #compulsory, send_message is a function that the consumer will use while sending the message to each peer
                'receive_dict':receive_dict
            }
        )
        
    async def send_sdp(self, event):
        receive_dict = event['receive_dict'] #serialized dict
        
        await self.send(text_data = json.dumps(receive_dict))