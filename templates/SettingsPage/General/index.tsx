import { useState } from "react";
import Select from "@/components/Select";
import { SelectOption } from "@/types/select";
import TabContainer from "../TabContainer";
import Line from "../Line";

const themeOptions = [
    { id: 0, name: "Светлая" },
    { id: 1, name: "Тёмная" },
    { id: 2, name: "Системная" },
];

const fontSizeOptions = [
    { id: 0, name: "Мелкий" },
    { id: 1, name: "Средний" },
    { id: 2, name: "Крупный" },
];

const languageOptions = [
    { id: 0, name: "Русский" },
    { id: 1, name: "English" },
];

const General = ({}) => {
    const [theme, setTheme] = useState<SelectOption | null>(themeOptions[0]);
    const [fontSize, setFontSize] = useState<SelectOption | null>(
        fontSizeOptions[1]
    );
    const [language, setLanguage] = useState<SelectOption | null>(
        languageOptions[0]
    );

    return (
        <TabContainer title="Общие настройки">
            <Line title="Тема" description="Выберите тему интерфейса.">
                <Select
                    value={theme}
                    onChange={setTheme}
                    options={themeOptions}
                />
            </Line>
            <Line
                title="Размер текста"
                description="Настройте удобный размер текста в интерфейсе."
            >
                <Select
                    value={fontSize}
                    onChange={setFontSize}
                    options={fontSizeOptions}
                />
            </Line>
            <Line title="Язык" description="Выберите язык интерфейса.">
                <Select
                    value={language}
                    onChange={setLanguage}
                    options={languageOptions}
                />
            </Line>
        </TabContainer>
    );
};

export default General;
