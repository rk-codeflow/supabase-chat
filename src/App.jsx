import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(message);
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

    return () => subscription.unsubscribe();
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
              <p>Signed in as {session?.user?.user_metadata?.name} ...</p>
              <p className="italic text-sm font-bold">3 users online</p>
            </div>
            <button className="bg-green-400 text-white" onClick={signOut}>
              Sign out
            </button>
          </div>

          {/* Main body  */}
          <div className="min-h-[600px] border-b-[1px] p-2">
            <div className="flex items-center gap-x-2">
              <img
                src={session?.user?.user_metadata?.picture}
                alt="user picture"
                className="rounded-full h-8 w-8"
              />
              <p className="bg-white rounded-md text-gray-700 p-1 font-semibold">
                {message}
              </p>
            </div>
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
