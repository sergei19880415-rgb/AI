export const content = [
    {
        id: 0,
        date: "Today, 15 : 32",
        chat: [
            {
                id: 0,
                message: {
                    content:
                        "Hi, I’m stuck with my math homework. I don’t understand this problem at all.",
                },
                answer: {
                    content: "No worries! Can you share the question with me?",
                },
            },
        ],
    },
    {
        id: 1,
        date: "Today, 15 : 34",
        chat: [
            {
                id: 0,
                message: {
                    content:
                        "I just uploaded this math problem, but honestly I’m confused. There are too many variables. Where do I even start?",
                    image: "/images/preview-image.jpg",
                },
                answer: {
                    content: (
                        <>
                            <p>
                                I see the image! 📷 It looks like a system of
                                linear equations with 4 variables
                                x1,x2,x3,x4x_1, x_2, x_3, x_4x1​,x2​,x3​,x4​.
                                The flow usually goes like this:
                            </p>
                            <ol>
                                <li>Write the equations in matrix form.</li>
                                <li>
                                    Choose a method (substitution, elimination,
                                    or matrix/row reduction).
                                </li>
                                <li>
                                    Solve step by step until you isolate each
                                    variable.
                                </li>
                            </ol>
                        </>
                    ),
                },
            },
        ],
    },
    {
        id: 2,
        date: "Today, 15 : 44",
        chat: [
            {
                id: 0,
                message: {
                    content: "I just uploaded this file. Can you summarize it?",
                    file: true,
                },
                answer: {
                    content:
                        "Yes! 📄 The file has 32 pages. Do you want me to give a general overview or a chapter-by-chapter summary?",
                },
            },
        ],
    },
    {
        id: 3,
        date: "Today, 15 : 54",
        chat: [
            {
                id: 0,
                message: {
                    content: "General overview first.",
                },
                answer: {
                    content: (
                        <>
                            <p>Here’s a high-level summary of World War II:</p>
                            <ul>
                                <li>
                                    🌍 Origins: The Treaty of Versailles, rise
                                    of fascism in Germany & Italy, and Japanese
                                    expansion in Asia.
                                </li>
                                <li>
                                    ⚔️ Key Events: German invasion of Poland
                                    (1939), Battle of Britain, Operation
                                    Barbarossa, Pearl Harbor, D-Day, and the
                                    Pacific campaign.
                                </li>
                                <li>
                                    🏴 Major Powers: Axis (Germany, Italy,
                                    Japan) vs Allies (UK, USA, USSR, China,
                                    France).
                                </li>
                                <li>
                                    💥 End of War: Atomic bombings of Hiroshima
                                    & Nagasaki, German surrender in May 1945,
                                    Japan’s surrender in September 1945.
                                </li>
                                <li>
                                    📌 Impact: 70+ million deaths, creation of
                                    UN, Cold War beginnings.
                                </li>
                            </ul>
                        </>
                    ),
                },
            },
        ],
    },
    {
        id: 4,
        date: "Today, 16 : 12",
        chat: [
            {
                id: 0,
                message: {
                    content:
                        "Hi, can you generate an image of a golden retriever puppy sitting on the grass?",
                },
                answer: {
                    image: "/images/image-1.png",
                },
            },
        ],
    },
    {
        id: 5,
        date: "Today, 18 : 11",
        chat: [
            {
                id: 0,
                message: {
                    content:
                        "can you generate a video of a five friends gathered around a table in a stylish restaurant, enjoying food and drinks together ?",
                },
                answer: {
                    content:
                        "Got it! Generating a video of five friends gathered around a table in a stylish restaurant, enjoying food and drinks together. 🍷🍝",
                    video: "/images/video.mp4",
                },
            },
        ],
    },
];
