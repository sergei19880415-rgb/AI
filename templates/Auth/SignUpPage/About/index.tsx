import { useState } from "react";
import Head from "@/components/Login/Head";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Field from "@/components/Field";
import Checkbox from "@/components/Checkbox";
import { SelectOption } from "@/types/select";
import UploadAvatar from "./UploadAvatar";

type Props = {
    onContinue: () => void;
};

const roleOptions = [
    { id: 0, name: "Student" },
    { id: 1, name: "Teacher" },
    { id: 2, name: "Other" },
];

const whatDoYouWantToUseOptions = [
    { id: 0, name: "Learning & Study" },
    { id: 1, name: "Coding Help" },
    { id: 2, name: "Other" },
];

const About = ({ onContinue }: Props) => {
    const [fullname, setFullname] = useState("");
    const [role, setRole] = useState<SelectOption | null>(null);
    const [whatDoYouWantToUse, setWhatDoYouWantToUse] = useState<
        SelectOption[] | null
    >(null);
    const [agreeTerms, setAgreeTerms] = useState(false);

    return (
        <>
            <Head
                title="Tell us about you"
                description="Help us personalize Zyra to give you the best experience."
            />
            <UploadAvatar />
            <Field
                className="mb-3"
                label="Fullname"
                placeholder="Enter your fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
            />
            <Select
                className="mb-3"
                classButton="h-12 !px-3 font-normal"
                classOption="!px-3 py-2 font-normal"
                label="Choose your role / Interest"
                placeholder="Select option your role / interest"
                value={role}
                onChange={setRole}
                options={roleOptions}
            />
            <Select
                className="mb-4"
                classButton="h-12 !px-3 font-normal"
                classOption="!px-3 py-2 font-normal"
                label="What do you want to use Zyra for?"
                placeholder="Select option what do you want to use"
                value={whatDoYouWantToUse}
                onChange={setWhatDoYouWantToUse}
                options={whatDoYouWantToUseOptions}
                multiple
            />
            <Checkbox
                className="mb-4"
                label="I agree to the Terms & Privacy Policy"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
            />
            <Button className="w-full" isPrimary onClick={onContinue}>
                Continue
            </Button>
        </>
    );
};

export default About;
