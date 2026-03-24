import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ClassInfo, ClassDetail } from '../types';
import { classApi } from '../services/class';

export const useClassStore = defineStore('class', () => {
  const myClasses = ref<ClassInfo[]>([]);
  const currentClass = ref<ClassDetail | null>(null);
  const loading = ref(false);

  async function fetchMyClasses() {
    loading.value = true;
    try {
      const res = await classApi.getMyClasses();
      if (res.data) {
        myClasses.value = res.data;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchClassDetail(id: string) {
    loading.value = true;
    try {
      const res = await classApi.getDetail(id);
      if (res.data) {
        currentClass.value = res.data;
      }
    } finally {
      loading.value = false;
    }
  }

  async function createClass(data: { name: string; min_members?: number; max_members?: number; grade_tag?: string }) {
    const res = await classApi.create(data);
    if (res.data) {
      myClasses.value.unshift(res.data);
      return res.data;
    }
  }

  async function joinClass(inviteCode: string) {
    const res = await classApi.join(inviteCode);
    if (res.data) {
      myClasses.value.unshift(res.data);
      return res.data;
    }
  }

  async function updateClass(id: string, data: { name?: string; min_members?: number; max_members?: number; grade_tag?: string }) {
    const res = await classApi.update(id, data);
    if (res.data) {
      currentClass.value = { ...currentClass.value, ...res.data } as ClassDetail;
      const idx = myClasses.value.findIndex(c => c.id === id);
      if (idx >= 0) {
        myClasses.value[idx] = { ...myClasses.value[idx], ...res.data };
      }
      return res.data;
    }
  }

  async function deleteClass(id: string) {
    await classApi.delete(id);
    myClasses.value = myClasses.value.filter(c => c.id !== id);
    currentClass.value = null;
  }

  return {
    myClasses,
    currentClass,
    loading,
    fetchMyClasses,
    fetchClassDetail,
    createClass,
    joinClass,
    updateClass,
    deleteClass,
  };
});
