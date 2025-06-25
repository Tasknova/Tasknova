// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("send-to-n8n function started.")

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { description } = await req.json()
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')

    if (!n8nWebhookUrl) {
      throw new Error("N8N_WEBHOOK_URL is not set in Supabase secrets.")
    }

    console.log("Forwarding to n8n webhook...")
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_description: description }),
    })

    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text()
      console.error("n8n webhook returned an error:", n8nResponse.status, errorBody)
      throw new Error(`n8n webhook failed with status: ${n8nResponse.status}`)
    }
    
    console.log("Successfully forwarded to n8n.")

    return new Response(JSON.stringify({ message: "Successfully forwarded to n8n" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

/*
To set the secret locally:
1. Set up your project locally using `supabase init`
2. Create a file `.env.local` in the `supabase` folder
3. Add `N8N_WEBHOOK_URL="your_webhook_url"` to the file
4. Run `supabase start`

To set the secret in production:
1. Go to your project's dashboard on supabase.com
2. Navigate to Settings > Edge Functions
3. Add a new secret with the name N8N_WEBHOOK_URL and your webhook URL as the value
*/

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-to-n8n' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
