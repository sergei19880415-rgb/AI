import { useState } from "react";
import Select from "@/components/Select";
import Field from "@/components/Field";
import Switch from "@/components/Switch";
import { SelectOption } from "@/types/select";
import TabContainer from "../TabContainer";
import Line from "../Line";

const responseStyleOptions = [
    { id: 0, name: "Сбалансированный" },
    { id: 1, name: "Быстрый" },
    { id: 2, name: "Подробный" },
];

const General = ({}) => {
    const [responseStyle, setResponseStyle] = useState<SelectOption | null>(
        responseStyleOptions[0]
    );
    const [role, setRole] = useState("");
    const [aboutYou, setAboutYou] = useState("");
    const [savedMemories, setSavedMemories] = useState(true);
    const [savedChatHistory, setSavedChatHistory] = useState(true);

    return (
        <>
            <TabContainer title="Персонализация">
                <Line
                    title="Стиль ответа"
                    description="Выберите формат ответов: быстрее или подробнее."
                >
                    <Select
                        value={responseStyle}
                        onChange={setResponseStyle}
                        options={responseStyleOptions}
                    />
                </Line>
            </TabContainer>
            <TabContainer title="О вас">
                <Field
                    label="Роль / чем занимаетесь"
                    placeholder="Например: маркетолог, разработчик, студент"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                />
                <Field
                    label="Дополнительная информация"
                    placeholder="Расскажите, какие задачи решаете с помощью AI"
                    value={aboutYou}
                    onChange={(e) => setAboutYou(e.target.value)}
                    required
                />
            </TabContainer>
            <TabContainer title="Память и история">
                <Line
                    title="Сохранение памяти"
                    description="Сохранять ключевые факты из прошлых диалогов."
                >
                    <Switch
                        checked={savedMemories}
                        onChange={setSavedMemories}
                    />
                </Line>
                <Line
                    title="Сохранение истории чатов"
                    description="Хранить историю переписок для удобного продолжения диалогов."
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
