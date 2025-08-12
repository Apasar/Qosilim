<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

const user = ref({});
const profile = ref({
    seeking: '',
    offering: '',
    tags: ''
});
const tg = ref(null);
const allProfiles = ref([]);
const isLoading = ref(true);
const searchTerm = ref('');

// Фильтруем пользователей на основе того, что введено в поиске
const filteredProfiles = computed(() => {
    if (!searchTerm.value) {
        return allProfiles.value.filter(p => p.userId !== user.value.id);
    }
    return allProfiles.value.filter(p => 
        p.userId !== user.value.id &&
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

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
        // ЗАМЕНИТЕ НА ВАШ URL С RENDER
        const response = await fetch('https://qoslim.onrender.com/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        if (!response.ok) throw new Error('Ошибка сети');
        
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
    isLoading.value = true;
    try {
        // ЗАМЕНИТЕ НА ВАШ URL С RENDER
        const response = await fetch('https://qoslim.onrender.com/api/profiles');
        if (!response.ok) throw new Error('Ошибка сети');
        allProfiles.value = await response.json();
    } catch (error) {
        console.error('Не удалось загрузить профили:', error);
    } finally {
        isLoading.value = false;
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
        user.value = {
            id: 99999,
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
    <div class="max-w-xl mx-auto p-4 space-y-8">
        <!-- Блок редактирования своего профиля -->
        <div class="p-6 border rounded-xl bg-white shadow-lg transition-shadow hover:shadow-xl">
             <h2 class="text-2xl font-bold mb-4 text-gray-800">Мой профиль</h2>
            <div class="flex items-center space-x-4 mb-6">
                <img :src="user.photo_url || 'https://placehold.co/80x80/E0E7FF/4F46E5?text=Me'" alt="User Photo" class="w-20 h-20 rounded-full border-4 border-white shadow-md">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{{ user.first_name }} {{ user.last_name }}</h1>
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
            <button v-if="!tg" @click="saveProfile" class="w-full mt-6 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105">
                Сохранить (для теста в браузере)
            </button>
        </div>

        <!-- Блок для отображения других профилей -->
        <div class="p-6 border rounded-xl bg-white shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">Пользователи Net-Sphere</h2>
            
            <!-- Поиск -->
            <div class="mb-4">
                <input type="text" v-model="searchTerm" class="input-field" placeholder="Поиск по имени...">
            </div>

            <!-- Индикатор загрузки -->
            <div v-if="isLoading" class="text-center py-8 text-gray-500">
                <p>Загрузка...</p>
            </div>

            <!-- Список пользователей -->
            <div v-else-if="filteredProfiles.length > 0" class="space-y-4">
                <div v-for="p in filteredProfiles" :key="p.userId" class="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <div class="flex items-center space-x-4 mb-3">
                        <img :src="p.photo_url || 'https://placehold.co/48x48/F3F4F6/9CA3AF?text=U'" alt="User Photo" class="w-12 h-12 rounded-full">
                        <div>
                            <h3 class="font-bold text-lg text-gray-900">{{ p.first_name }} {{ p.last_name }}</h3>
                            <p class="text-sm text-gray-500">@{{ p.username }}</p>
                        </div>
                    </div>
                    <div class="text-sm space-y-2 pl-16">
                        <p><strong class="font-medium text-gray-600">Ищет:</strong> {{ p.seeking || 'Не указано' }}</p>
                        <p><strong class="font-medium text-gray-600">Предлагает:</strong> {{ p.offering || 'Не указано' }}</p>
                        <p><strong class="font-medium text-gray-600">Теги:</strong> 
                           <span v-if="p.tags" class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-semibold">{{ p.tags }}</span>
                           <span v-else class="text-gray-400">Нет тегов</span>
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Если никого не найдено -->
            <div v-else class="text-center py-8 border-2 border-dashed rounded-lg text-gray-400">
                <p>Пользователи не найдены.</p>
            </div>
        </div>
    </div>
</template>

<style>
body {
    background-color: var(--tg-theme-bg-color, #f3f4f6);
    color: var(--tg-theme-text-color, #1f2937);
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.input-field {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--tg-theme-hint-color, #d1d5db);
    background-color: var(--tg-theme-bg-color, #ffffff);
    color: var(--tg-theme-text-color, #1f2937);
    transition: border-color 0.2s, box-shadow 0.2s;
}
.input-field:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}
.textarea-field { min-height: 80px; resize: vertical; }
.label { display: block; margin-bottom: 6px; font-weight: 600; color: #4b5563; }
</style>
