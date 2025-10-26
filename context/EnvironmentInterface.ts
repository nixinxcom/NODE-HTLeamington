
// GoogleApiKey?: process.env.NEXT_PUBLIC_COMPONENT_GoogleMap_geolocation_apiKey, //This parameter is used to manage the Google Maps API key.
// MapBoxKey?: process.env.NEXT_PUBLIC_COMPONENT_MapBox_token_apiKey, //This parameter is used to manage the MapBox API key.

interface iSocMeds{
    Platform?:null | undefined | string,
    Id?:null | undefined | string,
    icon?:null | undefined | string,
    url?:null | undefined | string
};
interface iDeliveryPlatforms{
    Platform?:null | undefined | string,
    Id?:null | undefined | string,
    icon?:null | undefined | string,
    url?:null | undefined | string
};
interface iChats{
    Platform?:null | undefined | string,
    Id?:null | undefined | string
};
interface iCookie{
    name: string,
    value: string,
    expiredays?: number,
};
interface iLogin{
    StartNavTime: Date[],
    EndNavTime: Date[],
};
interface iModelAi{
    model:  'gpt-5-nano' // GPT-4o: Our high-intelligence flagship model for complex, multi-step tasks. GPT-4o is cheaper and faster than GPT-4 Turbo. [1].	128,000 tokens	4,096 tokens	Up to Oct 2023
        |   'gpt-4o' // GPT-4o: Our high-intelligence flagship model for complex, multi-step tasks. GPT-4o is cheaper and faster than GPT-4 Turbo. [1].	128,000 tokens	4,096 tokens	Up to Oct 2023
        |   'gpt-4o-202 4-05-13' // gpt-4o currently points to this version.	128,000 tokens	4,096 tokens	Up to Oct 2023
        |   'gpt-4o-202 4-08-06' // Latest snapshot that supports Structured Outputs	128,000 tokens	16,384 tokens	Up to Oct 2023
        |   'chatgpt-4o -latest' // Dynamic model continuously updated to the current version of GPT-4o in ChatGPT. Intended for research and evaluation [2].	128,000 tokens	16,384 tokens	Up to Oct 2023
        |   'gpt-4o-mini' // GPT-4o-mini: Our affordable and intelligent small model for fast, lightweight tasks. GPT-4o mini is cheaper and more capable than GPT-3.5 Turbo. Currently points to gpt-4o-mini-2024-07-18.	128,000 tokens	16,384 tokens	Up to Oct 2023
        |   'gpt-4o-mini-2024-07-18' // gpt-4o-mini currently points to this version.	128,000 tokens	16,384 tokens	Up to Oct 2023
        |   'o1-preview' // Points to the most recent snapshot of the o1 model: o1-preview-2024-09-12	128,000 tokens	32,768 tokens	Up to Oct 2023
        |   'o1-preview-2024-09-12' // Latest o1 model snapshot	128,000 tokens	32,768 tokens	Up to Oct 2023
        |   'o1-mini' // Points to the most recent o1-mini snapshot: o1-mini-2024-09-12	128,000 tokens	65,536 tokens	Up to Oct 2023
        |   'o1-mini-2024-09-12' // Latest o1-mini model snapshot	128,000 tokens	65,536 tokens	Up to Oct 2023
        |   'gpt-4-turbo' // The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling. Currently points to gpt-4-turbo-2024-04-09.	128,000 tokens	4,096 tokens	Up to Dec 2023
        |   'gpt-4-turbo-2024-04-09' // GPT-4 Turbo with Vision model. Vision requests can now use JSON mode and function calling. gpt-4-turbo currently points to this version.	128,000 tokens	4,096 tokens	Up to Dec 2023
        |   'gpt-4-turbo-preview' // GPT-4 Turbo preview model. Currently points to gpt-4-0125-preview.	128,000 tokens	4,096 tokens	Up to Dec 2023
        |   'gpt-4-0125-preview' // GPT-4 Turbo preview model intended to reduce cases of “laziness” where the model doesn’t complete a task. Learn more.	128,000 tokens	4,096 tokens	Up to Dec 2023
        |   'gpt-4-1106-preview' // GPT-4 Turbo preview model featuring improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. This is a preview model. Learn more.	128,000 tokens	4,096 tokens	Up to Apr 2023
        |   'gpt-4' // Currently points to gpt-4-0613. See continuous model upgrades.	8,192 tokens	8,192 tokens	Up to Sep 2021
        |   'gpt-4-0613' // Snapshot of gpt-4 from June 13th 2023 with improved function calling support.	8,192 tokens	8,192 tokens	Up to Sep 2021
        |   'gpt-4-0314' // Legacy Snapshot of gpt-4 from March 14th 2023.	8,192 tokens	8,192 tokens	Up to Sep 2021
        |   'gpt-3.5-turbo-0125' // The latest GPT-3.5 Turbo model with higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls. Learn more.	16,385 tokens	4,096 tokens	Up to Sep 2021
        |   'gpt-3.5-turbo' // Currently points to gpt-3.5-turbo-0125.	16,385 tokens	4,096 tokens	Up to Sep 2021
        |   'gpt-3.5-turbo-1106' // GPT-3.5 Turbo model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Learn more.	16,385 tokens	4,096 tokens	Up to Sep 2021
        |   'gpt-3.5-turbo-instruct' // Similar capabilities as GPT-3 era models. Compatible with legacy Completions endpoint and not Chat Completions.	4,096 tokens	4,096 tokens	Up to Sep 2021
        |   'dall-e-3' // The latest DALL·E model released in Nov 2023.
        |   'dall-e-2' // The previous DALL·E model released in Nov 2022. The 2nd iteration of DALL·E with more realistic, accurate, and 4x greater resolution images than the original model.
        |   'tts-1' // The latest text to speech model, optimized for speed.
        |   'tts-1-hd' // The latest text to speech model, optimized for quality.
        |   'text-embedding-3-large' // Most capable embedding model for both english and non-english tasks	3,072
        |   'text-embedding-3-small' // Increased performance over 2nd generation ada embedding model	1,536
        |   'text-embedding-ada-002	' // Most capable 2nd generation embedding model, replacing 16 first generation models	1,536
        |   'text-moderation-latest' // Currently points to text-moderation-007.	32,768
        |   'text-moderation-stable' // Currently points to text-moderation-007.	32,768
        |   'text-moderation-007' // Most capable moderation model across all categories.	32,768
        |   'babbage-002' // Replacement for the GPT-3 ada and babbage base models.	16,384 tokens	Up to Sep 2021
        |   'davinci-002' // Replacement for the GPT-3 curie and davinci base models.	16,384 tokens	Up to Sep 2021
};
interface  iTranslations {
  [key: string]: string;
}

export interface iEnvironment { //This object is used to manage the user environment.
    User?:{
            DefaultID?:null | undefined | string, //This parameter is used to manage the default user ID.
            ClientID?:null | undefined | string,  //This parameter is used to manage the user ID.
            SignUpDate?:string[] | Date[], //This parameter is used to manage the user sign in date.
            FirstName?:null | undefined | string, //This parameter is used to manage the user first name.
            LastName?:null | undefined | string, //This parameter is used to manage the user last name.
            Birthday?:{
                year?:null | undefined | number,
                month?:null | undefined | number,
                day?:null | undefined | number,
            },
            Email?:null | undefined | string, //This parameter is used to manage the user email.
            Phone?:null | undefined | number, //This parameter is used to manage the user phone.
            SIN?:null | undefined | number,
            TaxID?:null | undefined | string,
            Lang1?:null | undefined | string, //This parameter is used to manage the user language 1.
            Lang2?:null | undefined | string, //This parameter is used to manage the user language 2.
            Currency?:null | undefined | string, //This parameter is used to manage the user currency.
        },
    Geo?:{
            GLat?:null | undefined | number, //This parameter is used to manage the user latitude.
            GLng?:null | undefined | number, //This parameter is used to manage the user longitude.
            GAproach?:null | undefined | number, //This parameter is used to manage the user longitude.
            StartNavTime?:null | undefined | Date, //This parameter is used to manage the user longitude.
            GLinkURL?:null | undefined | string, //This parameter is used to manage the user longitude.
            DetailGeolocation?: any, //This parameter is used to manage the user longitude.
            GCountryKey?: string, //This parameter is used to manage the user longitude.
            GCountry?: string, //This parameter is used to manage the user longitude.
            GZipCode?: string, //This parameter is used to manage the user longitude.
            GProvState?: string, //This parameter is used to manage the user longitude.
            GZone?: string, //This parameter is used to manage the user longitude.
            GCol?: string, //This parameter is used to manage the user longitude.
            GStreet?: string, //This parameter is used to manage the user longitude.
        },
    Digital:{
            Website?:null | undefined | string, //This parameter is used to manage the user website.
            SocialMedia?: iSocMeds[], //This parameter is used to manage the user social media.
            DeliveryPlatforms?: iDeliveryPlatforms[], //This parameter is used to manage the user delivery platforms.
            Chat?:iChats[],  //This parameter is used to manage the user chats platforms.
            Navigator?:null | undefined | string, //This parameter is used to manage the user navigator.
            DarkMode?: null | undefined | boolean, //This parameter is used to manage the user dark mode.
            Cookies?:null | undefined | boolean, //This parameter is used to manage the user cookies.
            CookiesSaved?:null | undefined | iCookie[], //This parameter is used to manage the user cookies saved.
        },
    Company?:{
            Name?:null | undefined | string, //This parameter is used to manage the user company name.
            Brand?:null | undefined | string, //This parameter is used to manage the user brand.
            Logo?:null | undefined | string, //This parameter is used to manage the user logo.
            Slogan?:null | undefined | string, //This parameter is used to manage the user slogan.
            BackgroundColor?:null | undefined | string,
            FontColor?:null | undefined | string,
        },
    Membership?:{
           Status?:null | undefined | boolean | string, //This parameter is used to manage the user status.
           Category?:null | undefined | string | number, //This parameter is used to manage the user type of membership.
           Balance?: number,
           eStatements?: boolean,
           MonthsDue?: number,
        },
    Access?:{
            Authenticated?: null | undefined | boolean, //This parameter is used to manage the user authentication.
            StartNavTime?: null | undefined | iLogin[], //This parameter is used to manage the user start navigation time.
            Alerts?: any[], //This parameter is used to manage the user alerts.
        },
    Stickys?:{
            Favorites?: any[], //This parameter is used to manage the user favorites.
        },
    States: {
            [key: string]: any,
        },
    setStates: {
            [key: string]: React.Dispatch<React.SetStateAction<any>>,
        },
    Languages?: {
            [key: string]: {};
        },
    UsrLocal?: null | undefined | string,
    AiModel: iModelAi,
    Translations?: iTranslations[]
};