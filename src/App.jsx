import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const { data, error } = await supabase.from("messages").insert([
      {
        content: message,
        user_id: session.user.id,
        user_name: session.user.user_metadata.name,
        user_avatar: session.user.user_metadata.picture,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setMessage("");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.log("Error occurred while logging in", error);
    } else {
      console.log("Logged in successfully", data);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error occurred while logging out", error);
    } else {
      console.log("Logged out successfully");
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <button className="bg-green-400 text-white" onClick={signIn}>
          Sign in with Google
        </button>
      </div>
    );
  } else
    return (
      <>
        <h2 className="font-bold text-center mt-2">Chat App Here</h2>
        <div className="max-w-3xl border m-auto mt-6 rounded-md">
          {/* Header */}
          <div className="flex justify-between items-center border-b-[1px] p-2">
            <div className="flex flex-col">
              <p>Signed in as {session?.user?.user_metadata?.name}</p>
            </div>
            <button className="bg-green-400 text-white" onClick={signOut}>
              Sign out
            </button>
          </div>

          {/* Main body */}
          <div className="min-h-[600px] border-b-[1px] p-2 message-container">
            {loading ? (
              <p>Loading messages...</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-2 ${
                    msg.user_id === session.user.id
                      ? "justify-end" // Sender's message on the right
                      : "justify-start" // Receiver's message on the left
                  }`}
                >
                  <div
                    className={`flex items-center gap-x-2 ${
                      msg.user_id === session.user.id
                        ? "flex-row-reverse" // Reverse order for sender
                        : ""
                    }`}
                  >
                    <img
                      src={msg.user_avatar}
                      alt="user avatar"
                      className="rounded-full h-8 w-8"
                    />
                    <div
                      className={`p-2 rounded-lg max-w-[90%] ${
                        msg.user_id === session.user.id
                          ? "bg-blue-500 text-white" // Sender's message style
                          : "bg-gray-200 text-gray-700" // Receiver's message style
                      }`}
                    >
                      <p className="font-semibold">{msg.user_name}</p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input for chat */}
          <form className="p-2" onSubmit={handleSubmit}>
            <input
              className="w-full border p-2 rounded-md"
              type="text"
              placeholder="Enter your message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-green-400 text-white mt-1 ml-auto flex"
            >
              Send
            </button>
          </form>
        </div>
      </>
    );
}
export default App;
