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
              "x-api-key": `${process.env.NEXT_PUBLIC_API_KEY}`
            },
            method: "POST",
            body: JSON.stringify({
              model: ReactorAIModel.REACTOR,
              messages: [
                {
                  role: "system",
                  content: `You are a helpful, friendly, assistant.`
                },
                ...messages
              ],
           
              temperature: 0.7,
              stream: true
            })
          });
        

          console.log('res', res.status)
          if (res.status !== 200) {
            throw new Error("Reactor API returned an error");
          }
        
          const stream = new ReadableStream({
            async start(controller) {

                console.log('controller', controller)
              const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if (event.type === "event") {
                  const data = event.data;
                 console.log('data', data)
                  if (data === "[DONE]") {
                    controller.close();
                    return;
                  }
        
                  try {
                    const json = JSON.parse(data);
                    console.log('---?????? ', json)
                    const text = json.choices[0].delta.content;
                    const queue = encoder.encode(text);
                    controller.enqueue(queue);
                  } catch (e) {
                    controller.error(e);
                  }
                }
              };
        
              const parser = createParser(onParse);
        
              for await (const chunk of res.body as any) {
                parser.feed(decoder.decode(chunk));
              }
            }
          });
        
          return stream; 
    } catch (error) {
      console.log('error', error)
    }
   

}