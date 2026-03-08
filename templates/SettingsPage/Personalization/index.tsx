import { useState } from "react";
import Select from "@/components/Select";
import Field from "@/components/Field";
import Switch from "@/components/Switch";
import { SelectOption } from "@/types/select";
import TabContainer from "../TabContainer";
import Line from "../Line";

const noctisPersonalityOptions = [
    { id: 0, name: "Nerd" },
    { id: 1, name: "Businessman" },
];

const responseStyleOptions = [
    { id: 0, name: "Balance" },
    { id: 1, name: "Quick" },
    { id: 2, name: "Detailed" },
];

const interfaceMoodOptions = [
    { id: 0, name: "Calm" },
    { id: 1, name: "Energetic" },
    { id: 2, name: "Focused" },
];

const General = ({}) => {
    const [noctisPersonality, setNoctisPersonality] =
        useState<SelectOption | null>(noctisPersonalityOptions[0]);
    const [responseStyle, setResponseStyle] = useState<SelectOption | null>(
        responseStyleOptions[0]
    );
    const [interfaceMood, setInterfaceMood] = useState<SelectOption | null>(
        interfaceMoodOptions[0]
    );
    const [nickname, setNickname] = useState("");
    const [role, setRole] = useState("");
    const [aboutYou, setAboutYou] = useState("");
    const [savedMemories, setSavedMemories] = useState(true);
    const [savedChatHistory, setSavedChatHistory] = useState(true);

    return (
        <>
            <TabContainer title="Personalization">
                <Line
                    title="Noctis Personality"
                    description="Customize how Noctis expresses itself in conversation — from casual to professional."
                >
                    <Select
                        value={noctisPersonality}
                        onChange={setNoctisPersonality}
                        options={noctisPersonalityOptions}
                    />
                </Line>
                <Line
                    title="Response Style"
                    description="Control how detailed Noctis’ answers should be — quick summaries or in-depth insights."
                >
                    <Select
                        value={responseStyle}
                        onChange={setResponseStyle}
                        options={responseStyleOptions}
                    />
                </Line>
                <Line
                    title="Interface Mood"
                    description="Adjust the overall vibe of Zyra’s chat interface to match your focus and energy."
                >
                    <Select
                        value={interfaceMood}
                        onChange={setInterfaceMood}
                        options={interfaceMoodOptions}
                    />
                </Line>
            </TabContainer>
            <TabContainer title="About You">
                <Field
                    label="Nickname"
                    placeholder="What Noctis should call you?"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    required
                />
                <Field
                    label="Role"
                    placeholder="What role / job you doing now?"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                />
                <Field
                    label="More about you"
                    placeholder="Tell me more about you"
                    value={aboutYou}
                    onChange={(e) => setAboutYou(e.target.value)}
                    required
                />
            </TabContainer>
            <TabContainer title="Memory">
                <Line
                    title="Saved Memories"
                    description="Enable Zyra to remember previous chats and improve contextual understanding."
                >
                    <Switch
                        checked={savedMemories}
                        onChange={setSavedMemories}
                    />
                </Line>
                <Line
                    title="Saved Chat History"
                    description="Allow Zyra to store your past sessions for smoother ongoing conversations."
                >
                    <Switch
                        checked={savedChatHistory}
                        onChange={setSavedChatHistory}
                    />
                </Line>
            </TabContainer>
        </>
    );
};

export default General;
