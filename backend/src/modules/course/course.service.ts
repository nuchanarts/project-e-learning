import { courseRepository } from './course.repository';

export const courseService = {
  async list() {
    return courseRepository.findAll();
  },

  async getById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });
    return course;
  },
};
