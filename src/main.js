const {HtmlTelegramBot, userInfoToString} = require("./bot");
const ChatGptService = require("./gpt");

class MyTelegramBot extends HtmlTelegramBot {
    constructor(token) {
        super(token);
        this.mode = null;
        this.list = []
        this.theme = null;
        this.user = {};
        this.count = 0;
    }

    async start(msg) {
        this.mode = "main"
        const text = this.loadMessage("main")
        await this.sendImage("main")
        await this.sendText(text)

        //add menu icon
        await this.showMainMenu({
            "start":"Главное меню бота",
            "profile":"Генерация Tinder-профиля 😎",
            "opener":"Сообщение для знакомства 🥰",
            "message":"Переписка от вашего имени 😈",
            "date":"Переписка со звездами 🔥",
            "gpt":"Задать вопрос чату GPT 🧠",
            "html":"Демонстрация HTML"
        })
    }

    async html(msg) {
        const html = this.loadHtml("main")
        if(this.theme != null)
            await this.sendHTML(html, {theme: this.theme})
        else
            await this.sendText("Для начала нужно выбрать, какая у Вас установлена тема в Telegram!")
    }

    async gpt(msg) {
        this.mode = "gpt"
        await this.sendImage("gpt")
        const text = this.loadMessage("gpt")
        await this.sendText(text)
    }

    async gptDialog(msg) {
        const text = msg.text;
        const myMessage = await this.sendText("Ваше сообщение было отправлено на обработку ChatGPT. Ожидание...")
        const answer = await chatgpt.sendQuestion("Ответь на вопрос", text)
        await this.editText(myMessage, answer)
    }

    async date(msg) {
        this.mode = "date"
        await this.sendImage("date")
        const text = this.loadMessage("date")
        await this.sendTextButtons(text, {
            "date_grande":"Ариана Гранде",
            "date_robbie":"Марго Робби",
            "date_zendaya":"Зендея",
            "date_gosling":"Райн Гослинг",
            "date_hardy":"Том Харди"
        })
    }

    async dateDialog(msg) {
        const text = msg.text
        const myMessage = await this.sendText("Девушка набирает текст...")
        const answer = await chatgpt.addMessage(text)
        await this.editText(myMessage, answer)
    }

    async dateButton(callbackQuery) {
        const query = callbackQuery.data;
        await this.sendImage(query)
        await this.sendText("Отличный выбор! Пригласи девушку/парня на свидание за 5 сообщений:")
        const prompt = this.loadPrompt(query);
        chatgpt.setPrompt(prompt)
    }

    async message(msg) {
        this.list.clear
        this.mode = "message"
        await this.sendImage("message")
        const text = this.loadMessage("message")
        await this.sendTextButtons(text, {
            "message_next":"Следующее сообщение",
            "message_date":"Пригласить на свидание"
        })

    }

    async messageButton(callbackQuery) {
        const query = callbackQuery.data;
        const prompt = this.loadPrompt(query)
        const userChatHistory = this.list.join("\n\n");
        const myMessage = await this.sendText("ChatGPT думает над вариантами ответа...")
        const answer = await chatgpt.sendQuestion(prompt, userChatHistory) // too long
        await this.editText(myMessage, answer)
    }

    async messageDialog(msg) {
        const text = msg.text
        this.list.push(text)
    }

    async profile(msg) {
        this.mode = "profile"
        const text = this.loadMessage("profile")
        await this.sendImage("profile")
        await this.sendText(text)

        this.user = {}
        await this.sendText("Сколько Вам лет?")
    }

    async profileDialog(msg) {
        const text = msg.text
        this.count++;

        if(this.count === 1) {
            this.user["age"] = text;
            await this.sendText("Кем Вы работаете?")
        }
        else if(this.count === 2) {
            this.user["occupation"] = text;
            await this.sendText("У Вас есть хобби?")
        }
        else if(this.count === 3) {
            this.user["hobby"] = text;
            await this.sendText("Что Вам не нравиться в людях?")
        }
        else if(this.count === 4) {
            this.user["annoys"] = text;
            await this.sendText("Какие цели Вашего знакомства?")
        }
        else if(this.count === 5) {
            this.user["goals"] = text;
            //gpt
            const prompt = this.loadPrompt("profile")
            const info = userInfoToString(this.user);
            const myMessage = await this.sendText("ChatGPT генерирует описание Вашего профиля...")
            const answer = await chatgpt.sendQuestion(prompt, info);
            await this.editText(myMessage, answer)
            this.mode = null;
        }
    }

    async opener(msg) {
        this.mode = "opener"
        const text = this.loadMessage("opener")
        await this.sendImage("opener")
        await this.sendText(text)

        this.user = {}
        this.count = 0;
        await this.sendText("Имя девушки?")
    }

    async openerDialog(msg) {
        const text = msg.text
        this.count++;

        if(this.count === 1) {
            this.user["name"] = text;
            await this.sendText("Сколько ей лет?")
        }
        else if(this.count === 2) {
            this.user["age"] = text;
            await this.sendText("Оцените её внешность по шкале от 1 до 10?")
        }
        else if(this.count === 3) {
            this.user["handsome"] = text;
            await this.sendText("Кем она работает?")
        }
        else if(this.count === 4) {
            this.user["occupation"] = text;
            await this.sendText("Цель знакомства?")
        }
        else if(this.count === 5) {
            this.user["goals"] = text;
            //gpt
            const prompt = this.loadPrompt("opener")
            const info = userInfoToString(this.user);
            const myMessage = await this.sendText("ChatGPT генерирует Вашего первого сообщения...")
            const answer = await chatgpt.sendQuestion(prompt, info);
            await this.editText(myMessage, answer)
            this.mode = null;
        }
    }

    async hello(msg) {
        if(this.mode === "gpt")
            await this.gptDialog(msg);
        else if(this.mode === "date")
            await this.dateDialog(msg);
        else if(this.mode === "message")
            await this.messageDialog(msg);
        else if(this.mode === "profile")
            await this.profileDialog(msg);
        else if(this.mode === "opener")
            await this.openerDialog(msg);
        else if(this.theme === null) {
            await this.sendImage("avatar_main")
            await this.sendTextButtons("Какая у Вас тема в Telegram?", {
                "theme_light": "Светлая",
                "theme_dark": "Тёмная",
            })
        }
        else
            await this.sendText("Введите команду /start для того, чтобы увидеть возможности этого бота!")
    }

    async helloButton(callbackQuery) {
        const query = callbackQuery.data;
        if(query === "theme_light") {
            await this.sendText("У Вас установлена светлая тема")
            this.theme = "light"
        }
        else if(query === "theme_dark") {
            await this.sendText("У Вас установлена тёмная тема")
            this.theme = "dark"
        }
    }
}


const chatgpt = new ChatGptService("gpt:9p4dgMGH8xaays5cTFbEJFkblB3TGdVvUMGZg2yosnt0BhOs");
const bot = new MyTelegramBot("7334196227:AAGMUt2oggOO8ewmK5aLcfNcAlQaeE_QK8g");

bot.onCommand(/\/start/, bot.start) // /start
bot.onCommand(/\/html/, bot.html) // /html
bot.onCommand(/\/gpt/, bot.gpt) // /gpt
bot.onCommand(/\/date/, bot.date) // /date
bot.onCommand(/\/message/, bot.message) // /message
bot.onCommand(/\/profile/, bot.profile) // /profile
bot.onCommand(/\/opener/, bot.opener) // /profile

bot.onTextMessage(bot.hello)
bot.onButtonCallback(/^.*/, bot.helloButton) // any string
bot.onButtonCallback(/^date_.*/, bot.dateButton)
bot.onButtonCallback(/^message_.*/, bot.messageButton)