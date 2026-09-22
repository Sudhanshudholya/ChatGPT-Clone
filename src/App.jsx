import "./App.css";

import gptLogo from "./assets/chatgpt.svg";
import addBtn from "./assets/add-30.png";
import msgIcon from "./assets/message.svg";
import sendBtn from "./assets/send.svg";
import userIcon from "./assets/user-icon.png";
import gptImgLogo from "./assets/chatgptLogo.svg";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { sendMsgToGroq } from "./groq";

import { useEffect, useRef, useState } from "react";

const getInitialMessages = () => [
  {
    text: "Hello! 👋 How can I help you today?",
    isBot: true,
  },
];

const createChatId = () => {
  return Date.now().toString();
};

const getChatTitle = (text) => {
  const cleanText = text.trim();

  if (cleanText.length <= 30) {
    return cleanText;
  }

  return cleanText.substring(0, 30) + "...";
};

const App = () => {
  const msgEnd = useRef(null);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  /*
   * Load previous conversations from localStorage
   */
  const [conversations, setConversations] = useState(() => {
    try {
      const savedChats = localStorage.getItem("chat_history");

      return savedChats ? JSON.parse(savedChats) : [];
    } catch (error) {
      console.error("History loading error:", error);
      return [];
    }
  });

  /*
   * Current chat
   */
  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const savedChats = localStorage.getItem("chat_history");

      if (savedChats) {
        const chats = JSON.parse(savedChats);

        if (chats.length > 0) {
          return chats[0].id;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return createChatId();
  });

  /*
   * Current messages
   */
  const [messages, setMessages] = useState(() => {
    try {
      const savedChats = localStorage.getItem("chat_history");

      if (savedChats) {
        const chats = JSON.parse(savedChats);

        if (chats.length > 0) {
          return chats[0].messages;
        }
      }
    } catch (error) {
      console.error(error);
    }

    return getInitialMessages();
  });

  /*
   * Save conversations whenever they change
   */
  useEffect(() => {
    localStorage.setItem(
      "chat_history",
      JSON.stringify(conversations)
    );
  }, [conversations]);

  /*
   * Auto scroll
   */
  useEffect(() => {
    msgEnd.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /*
   * Save / update current conversation
   */
  const updateCurrentConversation = (
    updatedMessages,
    firstUserMessage = null
  ) => {
    setConversations((prev) => {
      const existingChat = prev.find(
        (chat) => chat.id === currentChatId
      );

      /*
       * If current chat doesn't exist,
       * create a new one.
       */
      if (!existingChat) {
        const newChat = {
          id: currentChatId,
          title: firstUserMessage
            ? getChatTitle(firstUserMessage)
            : "New Chat",
          messages: updatedMessages,
          updatedAt: Date.now(),
        };

        return [newChat, ...prev];
      }

      /*
       * Update existing chat
       */
      return prev
        .map((chat) => {
          if (chat.id !== currentChatId) {
            return chat;
          }

          return {
            ...chat,
            title:
              chat.title === "New Chat" && firstUserMessage
                ? getChatTitle(firstUserMessage)
                : chat.title,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  /*
   * Send message
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();

    setInput("");

    /*
     * User message
     */
    const userMessage = {
      text: text,
      isBot: false,
    };

    const messagesWithUser = [
      ...messages,
      userMessage,
    ];

    setMessages(messagesWithUser);

    /*
     * Immediately save user message
     */
    updateCurrentConversation(
      messagesWithUser,
      text
    );

    setLoading(true);

    try {
      /*
       * Get AI response
       */
      const res = await sendMsgToGroq(text);

      const botMessage = {
        text: res,
        isBot: true,
      };

      const finalMessages = [
        ...messagesWithUser,
        botMessage,
      ];

      /*
       * Show AI response
       */
      setMessages(finalMessages);

      /*
       * Save AI response
       */
      updateCurrentConversation(
        finalMessages,
        text
      );
    } catch (error) {
      console.error("AI Error:", error);

      const errorMessage = {
        text:
          "Sorry, something went wrong. Please try again.",
        isBot: true,
      };

      const finalMessages = [
        ...messagesWithUser,
        errorMessage,
      ];

      setMessages(finalMessages);

      updateCurrentConversation(
        finalMessages,
        text
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Enter = send
   * Shift + Enter = new line
   */
  const handleEnter = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      handleSend();
    }
  };

  /*
   * New Chat
   */
  const handleNewChat = () => {
    const newId = createChatId();

    setCurrentChatId(newId);

    setMessages(getInitialMessages());

    setInput("");

    setLoading(false);
  };

  /*
   * Open history chat
   */
  const openConversation = (chat) => {
    if (loading) return;

    setCurrentChatId(chat.id);

    setMessages(chat.messages);

    setInput("");
  };

  /*
   * Delete one conversation
   */
  const handleDeleteConversation = (e, chatId) => {
    e.stopPropagation();

    setConversations((prev) =>
      prev.filter((chat) => chat.id !== chatId)
    );

    // If the currently opened chat is deleted,
    // open a fresh chat.
    if (chatId === currentChatId) {
      const newId = createChatId();

      setCurrentChatId(newId);
      setMessages(getInitialMessages());
      setInput("");
      setLoading(false);
    }
  };

  /*
   * Sidebar query
   */
  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="App">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <div className="sideBar">

        {/* Sidebar Top */}

        <div className="upperSide">

          {/* Logo */}

          <div className="upperSideTop">

            <img
              src={gptLogo}
              alt="ChatGPT"
              className="logo"
            />

            <span className="brand">
              ChatGPT
            </span>

          </div>

          {/* New Chat */}

          <button
            className="midBtn"
            onClick={handleNewChat}
          >
            <img
              src={addBtn}
              alt="New Chat"
              className="addBtn"
            />

            New Chat
          </button>

          {/* Quick Questions */}

          <div className="upperSideBottom">

            <button
              className="query"
              onClick={() =>
                handleQuickQuestion(
                  "What is programming?"
                )
              }
            >
              <img
                src={msgIcon}
                alt="Question"
              />

              What is programming?
            </button>

            <button
              className="query"
              onClick={() =>
                handleQuickQuestion(
                  "How to use an API?"
                )
              }
            >
              <img
                src={msgIcon}
                alt="Question"
              />

              How to use an API?
            </button>

          </div>

        </div>

        {/* Recent History */}

        <div className="recentSection">

          <h3 className="recentTitle">
            Recent
          </h3>

          <div className="recentList">

            {conversations.length === 0 ? (

              <p className="noHistory">
                No conversations yet
              </p>

            ) : (

              conversations.map((chat) => (

                <button
                  key={chat.id}
                  className={`historyItem ${
                    chat.id === currentChatId
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    openConversation(chat)
                  }
                  type="button"
                >
                  <span className="historyIcon">
                    💬
                  </span>

                  <span className="historyText">
                    {chat.title}
                  </span>

                  <span
                    className="deleteHistory"
                    role="button"
                    tabIndex={0}
                    title="Delete chat"
                    onClick={(e) =>
                      handleDeleteConversation(
                        e,
                        chat.id
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " "
                      ) {
                        handleDeleteConversation(
                          e,
                          chat.id
                        );
                      }
                    }}
                  >
                    🗑️
                  </span>
                </button>

              ))

            )}

          </div>

        </div>

      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="main">

        {/* Top Bar */}

        <div className="topBar">

          <div></div>

          <div className="topActions">

            {/* <button>
              ↗ Share
            </button>

            <button>
              •••
            </button> */}

          </div>

        </div>

        {/* =================================================
            CHAT AREA
        ================================================= */}

        <div className="chats">

          {messages.map((msg, idx) => (

            <div
              key={idx}
              className={
                msg.isBot
                  ? "chat bot"
                  : "chat user"
              }
            >

              {msg.isBot ? (

                <>
                  <img
                    className="chatImg botImg"
                    src={gptImgLogo}
                    alt="AI"
                  />

                  <div className="txt">

                    <ReactMarkdown
                      remarkPlugins={[
                        remarkGfm,
                      ]}
                    >
                      {msg.text}
                    </ReactMarkdown>

                  </div>
                </>

              ) : (

                <>
                  <div className="userMessage">

                    <p>
                      {msg.text}
                    </p>

                  </div>

                  <img
                    className="chatImg userImg"
                    src={userIcon}
                    alt="User"
                  />
                </>

              )}

            </div>

          ))}

          {/* Loading */}

          {loading && (

            <div className="chat bot">

              <img
                className="chatImg botImg"
                src={gptImgLogo}
                alt="AI"
              />

              <div className="typing">

                <span></span>
                <span></span>
                <span></span>

              </div>

            </div>

          )}

          <div ref={msgEnd}></div>

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="chatFooter">

          <div className="inp">

            <textarea
              placeholder="Send a message"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={handleEnter}
              rows={1}
            />

            <button
              className="send"
              onClick={handleSend}
              disabled={
                loading ||
                !input.trim()
              }
            >
              <img
                src={sendBtn}
                alt="Send"
              />
            </button>

          </div>

          <p>
            ChatGPT can make mistakes. Check important info.
          </p>

        </div>

      </div>

    </div>
  );
};

export default App;