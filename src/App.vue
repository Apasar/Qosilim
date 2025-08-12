<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const user = ref({});
const profile = ref({
    seeking: '',
    offering: '',
    tags: ''
});
const tg = ref(null);

const otherProfiles = ref([]);

const saveProfile = async () => {
    if (!user.value.id) {
        alert('Данные пользователя еще не загружены.');
        return;
    }
    const profileData = { 
        userId: user.value.id, 
        seeking: profile.value.seeking,
        offering: profile.value.offering,
        tags: profile.value.tags,
        first_name: user.value.first_name,
        last_name: user.value.last_name,
        username: user.value.username,
        photo_url: user.value.photo_url
    };

    try {
        const response = await fetch('https://qosilim.onrender.com/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        if (!response.ok) throw new Error('Ошибка сети');
        const result = await response.json();
        console.log('Ответ от сервера:', result);
        if (tg.value) {
            tg.value.showPopup({ title: 'Успешно!', message: 'Профиль сохранен.' });
        } else {
            alert('Профиль успешно сохранен! (тестовый режим)');
        }
        fetchProfiles();
    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        alert(`Ошибка сохранения: ${error.message}`);
    }
};

const fetchProfiles = async () => {
    try {
        const response = await fetch('https://qosilim.onrender.com/api/profiles');
        if (!response.ok) throw new Error('Ошибка сети');
        const profiles = await response.json();
        otherProfiles.value = profiles.filter(p => p.userId !== user.value.id);
    } catch (error) {
        console.error('Не удалось загрузить профили:', error);
    }
};

onMounted(() => {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
        tg.value = window.Telegram.WebApp;
        tg.value.ready();
        if (tg.value.initDataUnsafe && tg.value.initDataUnsafe.user) {
            user.value = tg.value.initDataUnsafe.user;
        }
        tg.value.MainButton.setText('Сохранить профиль');
        tg.value.MainButton.show();
        tg.value.onEvent('mainButtonClicked', saveProfile);
    } else {
        console.log("Тестирование в браузере. Используется заглушка.");
        // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Мы "заходим" под другим пользователем для теста ---
        user.value = {
            id: 99999, // Другой ID, чтобы увидеть пользователя 12345 в списке
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            photo_url: ''
        };
    }
    fetchProfiles();
});

onBeforeUnmount(() => {
    if (tg.value) {
        tg.value.offEvent('mainButtonClicked', saveProfile);
    }
});
</script>

<template>
    <div class="max-w-md mx-auto p-4">
        <!-- Блок редактирования своего профиля -->
        <div class="mb-8 p-4 border rounded-lg bg-white shadow-sm">
             <h2 class="text-xl font-bold mb-4">Мой профиль</h2>
            <div class="flex items-center space-x-4 mb-6">
                <img :src="user.photo_url || 'https://placehold.co/80x80/EFEFEF/333?text=User'" alt="User Photo" class="w-20 h-20 rounded-full border-2">
                <div>
                    <h1 class="text-2xl font-bold">{{ user.first_name }} {{ user.last_name }}</h1>
                    <p class="text-sm text-gray-500">@{{ user.username }}</p>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="seeking" class="label">🔍 Что я ищу?</label>
                    <textarea id="seeking" v-model="profile.seeking" class="input-field textarea-field" placeholder="Например: ментора в IT..."></textarea>
                </div>
                <div>
                    <label for="offering" class="label">🤝 Чем могу быть полезен?</label>
                    <textarea id="offering" v-model="profile.offering" class="input-field textarea-field" placeholder="Например: экспертиза в маркетинге..."></textarea>
                </div>
                <div>
                    <label for="tags" class="label">🏷️ Мои интересы и навыки (теги)</label>
                    <input type="text" id="tags" v-model="profile.tags" class="input-field" placeholder="Например: SaaS, FinTech, AI...">
                </div>
            </div>
            <button v-if="!tg" @click="saveProfile" class="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition">
                Сохранить (для теста в браузере)
            </button>
        </div>

        <!-- ИЗМЕНЕНИЕ ЗДЕСЬ: Блок для отображения других профилей -->
        <div>
            <h2 class="text-2xl font-bold mb-4">Пользователи Net-Sphere</h2>
            <div v-if="otherProfiles.length > 0" class="space-y-4">
                <div v-for="p in otherProfiles" :key="p.userId" class="p-4 border rounded-lg bg-white shadow-sm">
                    <div class="flex items-center space-x-3 mb-3">
                        <img :src="p.photo_url || 'https://placehold.co/40x40/EFEFEF/333?text=U'" alt="User Photo" class="w-10 h-10 rounded-full">
                        <div>
                            <h3 class="font-bold">{{ p.first_name }} {{ p.last_name }}</h3>
                            <p class="text-sm text-gray-500">@{{ p.username }}</p>
                        </div>
                    </div>
                    <div class="text-sm space-y-2 pl-12">
                        <p><strong>Ищет:</strong> {{ p.seeking || 'Не указано' }}</p>
                        <p><strong>Предлагает:</strong> {{ p.offering || 'Не указано' }}</p>
                        <p><strong>Теги:</strong> <span class="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">{{ p.tags || 'Нет тегов' }}</span></p>
                    </div>
                </div>
            </div>
            <div v-else class="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
                <p>Других пользователей пока нет. Будьте первым!</p>
            </div>
        </div>
    </div>
</template>

<style>
body {
    background-color: var(--tg-theme-bg-color, #f0f2f5);
    color: var(--tg-theme-text-color, #000000);
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.input-field {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--tg-theme-hint-color, #d1d5db);
    background-color: var(--tg-theme-bg-color, #ffffff);
    color: var(--tg-theme-text-color, #000000);
    transition: border-color 0.2s;
}
.input-field:focus {
    outline: none;
    border-color: #3b82f6;
}
.textarea-field { min-height: 80px; resize: vertical; }
.label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
</style>
