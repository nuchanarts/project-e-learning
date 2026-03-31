import { courseRepository } from './course.repository';

export const courseService = {
  async list(category?: string) {
    return courseRepository.findAll(category);
  },

  async getById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });
    return course;
  },
};
