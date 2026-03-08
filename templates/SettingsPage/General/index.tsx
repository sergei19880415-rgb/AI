import { useState } from "react";
import Select from "@/components/Select";
import { SelectOption } from "@/types/select";
import TabContainer from "../TabContainer";
import Line from "../Line";

const themeOptions = [
    { id: 0, name: "Light" },
    { id: 1, name: "Dark" },
    { id: 2, name: "System" },
];

const accentColorOptions = [
    { id: 0, name: "Default" },
    { id: 1, name: "Primary" },
    { id: 2, name: "Secondary" },
];

const fontSizeOptions = [
    { id: 0, name: "Small" },
    { id: 1, name: "Medium" },
    { id: 2, name: "Large" },
];

const languageOptions = [
    { id: 0, name: "English" },
    { id: 1, name: "Spanish" },
    { id: 2, name: "German" },
];

const voiceOptions = [
    { id: 0, name: "Ignis" },
    { id: 1, name: "Lunafreya" },
    { id: 2, name: "Gladio" },
];

const General = ({}) => {
    const [theme, setTheme] = useState<SelectOption | null>(themeOptions[0]);
    const [accentColor, setAccentColor] = useState<SelectOption | null>(
        accentColorOptions[0]
    );
    const [fontSize, setFontSize] = useState<SelectOption | null>(
        fontSizeOptions[1]
    );
    const [language, setLanguage] = useState<SelectOption | null>(
        languageOptions[0]
    );
    const [voice, setVoice] = useState<SelectOption | null>(voiceOptions[1]);

    return (
        <TabContainer title="General Settings">
            <Line title="Themes" description="Choose Chat AI themes">
                <Select
                    value={theme}
                    onChange={setTheme}
                    options={themeOptions}
                />
            </Line>
            <Line title="Accent Color" description="Choose accent color">
                <Select
                    value={accentColor}
                    onChange={setAccentColor}
                    options={accentColorOptions}
                />
            </Line>
            <Line title="Font Size" description="Chooses your font size">
                <Select
                    value={fontSize}
                    onChange={setFontSize}
                    options={fontSizeOptions}
                />
            </Line>
            <Line title="Language" description="Choose language">
                <Select
                    value={language}
                    onChange={setLanguage}
                    options={languageOptions}
                />
            </Line>
            <Line
                title="Voice Default Speaker"
                description="Choose voice speaker"
            >
                <Select
                    value={voice}
                    onChange={setVoice}
                    options={voiceOptions}
                />
            </Line>
        </TabContainer>
    );
};

export default General;
