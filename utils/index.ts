/* eslint-disable @typescript-eslint/no-explicit-any */
import { Message, ReactorAIModel } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const ReactorStream=async(messages: Message[])=>{
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    console.log('--->>> reactor', messages)
    console.log('Model', `${process.env.NEXT_PUBLIC_API_KEY}`)
    try {
      const res = await fetch("https://api.arc.ai/v1/chat-completions", {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || ''
        },
        method: "POST",
        body: JSON.stringify({
          model: ReactorAIModel.REACTOR,
          messages: [
            {
              role: "system",
              content: "You are a helpful, friendly, assistant."
            },
            ...messages
          ],
          temperature: 0.7,
          stream: true
        })
      });
  
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
          if (res.status !== 200) {
            throw new Error("Reactor API returned an error");
          }
        
          const stream = new ReadableStream({
            async start(controller) {
              for await (const chunk of res.body as any) {
                const decodedChunk = decoder.decode(chunk);
                try {

                  
                  const jsonStrings = decodedChunk.split(/\r?\n/).filter(str => str.trim() !== '');
                  for (const jsonString of jsonStrings) {
                    try {
                      const json = JSON.parse(jsonString);
                      if (json.done) {
                        controller.close();
                        return;
                      }
          
                      if (json.message && json.message.content) {
                        const text = json.message.content;
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                      }
                    } catch (e) {
                      console.error('Error parsing JSON:', e, 'Raw string:', jsonString);
                    }
                  }
                  
                } catch (e) {
                  console.error('Error parsing JSON:', e);
                  controller.error(e);
                }
              }
            }
          });
      
          return stream;
 
    } catch (error) {
      console.log('error', error)
    }
   

}