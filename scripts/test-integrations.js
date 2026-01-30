#!/usr/bin/env node
/**
 * Quick test of integration APIs (news, financial, social).
 * Run with: node scripts/test-integrations.js
 * Requires: server running on http://localhost:3050
 */

const API = "http://localhost:3050";

async function request(method, path, body) {
  const opts = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(res.status + " " + (data.message || data));
  return data;
}

async function main() {
  console.log("Testing integrations (server must be running on " + API + ")\n");

  let noteId;
  try {
    const created = await request("POST", "/api/notes/AddNote", {
      title: "Integration test note",
      content: "Testing news, financial, social",
      tags: ["test"],
      news: { enabled: true, keywords: ["technology", "AI"] },
      financial: { enabled: true, type: "crypto", symbols: ["bitcoin", "ethereum"] },
      social: { x: { enabled: true, keywords: ["crypto"] } }
    });
    noteId = created.id ?? created._id;
    console.log("Created note id:", noteId);
  } catch (e) {
    console.error("Failed to create note. Is the server running?", e.message);
    process.exit(1);
  }

  console.log("\n--- Fetch news ---");
  try {
    const newsRes = await request("POST", `/api/notes/${noteId}/fetch-news`);
    console.log("News articles count:", newsRes.count ?? (newsRes.articles && newsRes.articles.length) ?? 0);
    if (newsRes.articles && newsRes.articles[0]) {
      console.log("First headline:", newsRes.articles[0].title?.substring(0, 60) + "...");
    }
  } catch (e) {
    console.log("News error:", e.message);
  }

  console.log("\n--- Update financial (crypto - no key) ---");
  try {
    const finRes = await request("POST", `/api/notes/${noteId}/update-financial`);
    console.log("Financial updated:", finRes.prices ? finRes.prices.length + " prices" : finRes);
  } catch (e) {
    console.log("Financial error:", e.message);
  }

  console.log("\n--- Fetch tweets (RSS or mock if no Twitter key) ---");
  try {
    const tweetsRes = await request("POST", `/api/notes/${noteId}/fetch-tweets`);
    console.log("Tweets count:", tweetsRes.count ?? (tweetsRes.tweets && tweetsRes.tweets.length) ?? 0);
    if (tweetsRes.tweets && tweetsRes.tweets[0]) {
      console.log("First tweet text:", tweetsRes.tweets[0].text?.substring(0, 50) + "...");
    }
  } catch (e) {
    console.log("Tweets error:", e.message);
  }

  console.log("\n--- Get note (see stored integrations) ---");
  try {
    const notes = await request("GET", "/api/notes/GetNotes");
    const note = Array.isArray(notes) ? notes.find((n) => (n.id ?? n._id) === noteId) : null;
    if (note) {
      console.log("Note news articles:", note.news?.articles?.length ?? 0);
      console.log("Note financial prices:", note.financial?.data?.prices?.length ?? 0);
      console.log("Note tweets:", note.social?.x?.tweets?.length ?? 0);
    }
  } catch (e) {
    console.log("Get notes error:", e.message);
  }

  console.log("\nDone. You can delete the test note from the UI or leave it.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
