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

  console.log("Session =>", session);

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.log("Error occured while logging in", error);
    } else {
      console.log("Logged in successfully", data);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error occured while logging out", error);
    } else {
      console.log("Logged out successfully");
    }
  };

  // chat functionality here
  //

  // roomOne.send({
  //   type: "broadcast",
  //   event: "test",
  //   payload: { message: "hello, world" },
  // });

  // const presenceTrackStatus = async () => {
  //   const status = await roomOne.track({
  //     user: "XXXXXX",
  //     online_at: new Date().toISOString(),
  //   });
  //   console.log(status);
  // };

  // Realtime message handling

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
        <div className="max-w-3xl border  m-auto mt-6 rounded-md">
          {/* Header  */}
          <div className="flex justify-between items-center border-b-[1px] p-2">
            <div className="flex flex-col">
              <p>Signed in as {session?.user?.user_metadata?.name}</p>
              <p className="italic text-sm font-bold">3 users online</p>
            </div>
            <button className="bg-green-400 text-white" onClick={signOut}>
              Sign out
            </button>
          </div>

          {/* Main body  */}
          <div className="min-h-[600px] border-b-[1px] p-2 message-container">
            {loading ? (
              <p>Loading messages...</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-center gap-x-2 mb-2">
                  <img
                    src={msg.user_avatar}
                    alt="user avatar"
                    className="rounded-full h-8 w-8"
                  />
                  <div>
                    <p className="font-semibold">{msg.user_name}</p>
                    <p className="bg-white rounded-md text-gray-700 p-1">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input for chat  */}
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
