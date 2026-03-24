import crypto from 'crypto';
import { ClassRow } from '../../shared/types';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../../shared/errors';
import { CLASS_ASSEMBLE_DAYS, CLASS_STATUS, USER_MAX_CLASSES } from '../../shared/constants';
import * as classRepo from './repository';
import * as memberRepo from '../member/repository';
import * as messageService from '../message/service';
import { CreateClassInput, UpdateClassInput } from './schema';

function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
}

export async function createClass(data: CreateClassInput, creatorId: string): Promise<ClassRow> {
  // Check user class limit
  const count = await classRepo.countUserClasses(creatorId);
  if (count >= USER_MAX_CLASSES) {
    throw new BadRequestError(`每人最多加入 ${USER_MAX_CLASSES} 个班级`);
  }

  if (data.min_members && data.max_members && data.min_members > data.max_members) {
    throw new BadRequestError('最小人数不能大于最大人数');
  }

  // Generate unique invite code
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = await classRepo.findByInviteCode(inviteCode);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new BadRequestError('邀请码生成失败，请重试');
  }

  const assembleDeadline = new Date();
  assembleDeadline.setDate(assembleDeadline.getDate() + CLASS_ASSEMBLE_DAYS);

  return classRepo.createClass(data, creatorId, inviteCode, assembleDeadline);
}

export async function getClassDetail(classId: string): Promise<ClassRow & { members: any[] }> {
  const cls = await classRepo.findById(classId);
  if (!cls) throw new NotFoundError('班级不存在');

  const members = await memberRepo.listMembers(classId);
  return { ...cls, members };
}

export async function listClasses(status?: string, page = 1, limit = 20) {
  return classRepo.listPublicClasses(status, page, limit);
}

export async function listMyClasses(userId: string): Promise<ClassRow[]> {
  return classRepo.listUserClasses(userId);
}

export async function updateClass(classId: string, data: UpdateClassInput, userId: string): Promise<ClassRow> {
  const cls = await classRepo.findById(classId);
  if (!cls) throw new NotFoundError('班级不存在');
  if (cls.creator_id !== userId) throw new ForbiddenError('只有创建者可以修改班级');
  if (cls.status !== CLASS_STATUS.ASSEMBLING) throw new BadRequestError('只有拼班中的班级可以修改');

  const newMin = data.min_members ?? cls.min_members;
  const newMax = data.max_members ?? cls.max_members;
  if (newMin > newMax) throw new BadRequestError('最小人数不能大于最大人数');
  if (newMax < cls.current_members) throw new BadRequestError('最大人数不能小于当前已有人数');

  const updated = await classRepo.updateClass(classId, data);
  const result = updated || cls;

  // Check if class should auto-activate after edit (e.g. min_members lowered)
  if (result.status === CLASS_STATUS.ASSEMBLING && result.current_members >= (data.min_members ?? result.min_members)) {
    await classRepo.updateStatus(classId, CLASS_STATUS.ACTIVE);
    result.status = CLASS_STATUS.ACTIVE;
  }

  return result;
}

export async function deleteClass(classId: string, userId: string): Promise<void> {
  const cls = await classRepo.findById(classId);
  if (!cls) throw new NotFoundError('班级不存在');
  if (cls.creator_id !== userId) throw new ForbiddenError('只有创建者可以删除班级');
  if (cls.status !== CLASS_STATUS.ASSEMBLING) throw new BadRequestError('只有拼班中的班级可以删除');

  await classRepo.deleteClass(classId);
}

export async function joinClass(inviteCode: string, userId: string): Promise<ClassRow> {
  // Check user class limit
  const count = await classRepo.countUserClasses(userId);
  if (count >= USER_MAX_CLASSES) {
    throw new BadRequestError(`每人最多加入 ${USER_MAX_CLASSES} 个班级`);
  }

  const cls = await classRepo.findByInviteCode(inviteCode);
  if (!cls) throw new NotFoundError('邀请码无效');

  if (cls.status !== CLASS_STATUS.ASSEMBLING && cls.status !== CLASS_STATUS.ACTIVE) {
    throw new BadRequestError('该班级无法加入');
  }

  if (cls.current_members >= cls.max_members) {
    throw new BadRequestError('班级人数已满');
  }

  // Check if already a member
  const existing = await memberRepo.findMember(cls.id, userId);
  if (existing) {
    if (existing.status === 'active') {
      throw new ConflictError('你已经是该班级成员');
    }
  }

  // Add member
  await memberRepo.addMember(cls.id, userId, 'invite');
  const updated = await classRepo.incrementMembers(cls.id);

  // Add user to class conversation
  await messageService.addUserToClassConversation(cls.id, userId);

  // Check if class should auto-assemble
  if (updated && updated.status === CLASS_STATUS.ASSEMBLING && updated.current_members >= updated.min_members) {
    await classRepo.updateStatus(cls.id, CLASS_STATUS.ACTIVE);
    updated.status = CLASS_STATUS.ACTIVE;
  }

  return updated || cls;
}
