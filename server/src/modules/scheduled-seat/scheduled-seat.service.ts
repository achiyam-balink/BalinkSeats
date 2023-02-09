import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduledSeatDocument } from '../../schemas';

import { CreateScheduledSeatDto } from '../../dto';

import { ScheduledSeat } from '../../schemas';
import { SeatService } from '../seat/seat.service';
import { EmployeeService } from '../employee/employee.service';
import handleInvalidValueError from '../../../utils/errorHandling/handleGetById';
import isDatesOverlap from 'utils/datesAnalyze/isDatesOverlap';

@Injectable()
export class ScheduledSeatService {
  constructor(
    @InjectModel(ScheduledSeat.name)
    private readonly scheduledSeatModel: Model<ScheduledSeatDocument>,
    @Inject(SeatService) private readonly seatService: SeatService,
    @Inject(EmployeeService) private readonly employeeService: EmployeeService,
  ) {}

  async createScheduled(createScheduledSeatDto: CreateScheduledSeatDto) {
    const startDate = new Date(createScheduledSeatDto.startDate).setHours(
      0,
      0,
      0,
      0,
    );
    const endDate = new Date(createScheduledSeatDto.endDate).setHours(
      0,
      0,
      0,
      0,
    );
    const today = new Date().setHours(0, 0, 0, 0);
    if (endDate < startDate) {
      return {
        ERROR: 'End date cannot be before start date',
      };
    }

    if (startDate < today) {
      return {
        ERROR: 'Start date cannot be in the past',
      };
    }

    const seat = await this.seatService.findSeat(
      Object.assign({
        id: createScheduledSeatDto.seat,
        number: createScheduledSeatDto.seatNumber,
      }),
    );
    if (seat.ERROR) {
      return seat;
    }

    const isScheduled = await this.isSeatScheduled(seat, startDate, endDate);
    if (isScheduled) {
      return {
        ERROR: 'Seat is already scheduled for this time',
      };
    }

    const employee = await this.employeeService.findEmployee(
      Object.assign({
        id: createScheduledSeatDto.employee,
        email: createScheduledSeatDto.employeeEmail,
      }),
    );
    if (employee.ERROR) {
      return employee;
    }

    const isEmployeeHasSeat = await this.isEmployeeHasSeat(
      employee,
      startDate,
      endDate,
    );
    if (isEmployeeHasSeat) {
      return {
        ERROR: `Employee already has a seat for this time (${isEmployeeHasSeat.seat.number})`,
      };
    }

    const newScheduledSeat = new this.scheduledSeatModel({
      seat,
      employee,
      startDate: createScheduledSeatDto.startDate,
      endDate: createScheduledSeatDto.endDate,
    });

    const res = await newScheduledSeat.save();
    return {
      seat: res.seat,
      employee: res.employee,
      startDate: res.startDate,
      endDate: res.endDate,
      id: res._id,
    };
  }

  async findAllScheduled() {
    const res = await this.scheduledSeatModel.find().exec();
    const resWithEmployee = await Promise.all(
      res.map(async (scheduledSeat) => {
        const employee = await this.employeeService.findEmployee({
          id: scheduledSeat.employee,
        });
        const seat = await this.seatService.findSeat({
          id: scheduledSeat.seat,
        });
        return {
          seat: { id: scheduledSeat.seat, number: seat.number },
          employee: employee,
          startDate: scheduledSeat.startDate,
          endDate: scheduledSeat.endDate,
          id: scheduledSeat._id,
        };
      }),
    );
    return resWithEmployee;
  }

  async findScheduledById(id: string): Promise<{ ERROR: string | any } | any> {
    try {
      const res = await this.scheduledSeatModel.findById(id);
      if (!res) {
        throw new Error('ScheduledSeat not found');
      }
      return res;
    } catch (error) {
      return await handleInvalidValueError(error);
    }
  }

  async findBySeat({ seatId = '', seatNumber = '' }) {
    const seat = await this.seatService.findSeat(
      Object.assign({ id: seatId, number: seatNumber }),
    );
    if (seat.ERROR) {
      return seat;
    }
    return this.scheduledSeatModel.find({ seat: seat }).exec();
  }

  async findByEmployee({
    employeeId = '',
    employeeEmail = '',
    employeeFirstName = '',
    employeeLastName = '',
  }) {
    const employee = await this.employeeService.findEmployee(
      Object.assign({
        id: employeeId,
        email: employeeEmail,
        firstName: employeeFirstName,
        lastName: employeeLastName,
      }),
    );
    if (employee.ERROR) {
      return employee;
    }
    return this.scheduledSeatModel.find({ employee }).exec();
  }

  async findByDate({ startDate, endDate }) {
    if (startDate && endDate)
      return this.scheduledSeatModel.find({
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });
    if (startDate)
      return this.scheduledSeatModel.find({
        startDate: { $gte: startDate },
      });
    if (endDate)
      return this.scheduledSeatModel.find({
        endDate: { $lte: endDate },
      });
  }

  async findScheduled({
    id,
    seat,
    seatNumber,
    employee,
    employeeEmail,
    employeeFirstName,
    employeeLastName,
    startDate,
    endDate,
  }) {
    try {
      const res = id
        ? await this.findScheduledById(id)
        : seat || seatNumber
        ? await this.findBySeat({ seatId: seat, seatNumber })
        : employee || employeeFirstName || employeeLastName || employeeEmail
        ? await this.findByEmployee({
            employeeId: employee,
            employeeEmail,
            employeeFirstName,
            employeeLastName,
          })
        : startDate || endDate
        ? await this.findByDate({ startDate, endDate })
        : await this.findAllScheduled();
      return res;
    } catch (error) {
      return await handleInvalidValueError(error);
    }
  }

  async deleteScheduledById(
    id: string,
  ): Promise<{ ERROR: string | any } | any> {
    try {
      const scheduled = await this.scheduledSeatModel.findByIdAndDelete(id);
      if (!scheduled) {
        throw new Error('ScheduledSeat not found');
      }
      return scheduled;
    } catch (error) {
      return await handleInvalidValueError(error);
    }
  }

  async isSeatScheduled(seat, startDate, endDate, exceptScheduleId = '') {
    const seatScheduled = await this.findBySeat({ seatId: seat._id });
    if (seatScheduled.ERROR) {
      return seatScheduled;
    }
    return seatScheduled.some((scheduled) => {
      if (exceptScheduleId && scheduled.id == exceptScheduleId) return false;

      const scheduledStartDate = new Date(scheduled.startDate).setHours(
        0,
        0,
        0,
        0,
      );
      const scheduledEndDate = new Date(scheduled.endDate).setHours(0, 0, 0, 0);
      return isDatesOverlap(
        [startDate, endDate],
        [scheduledStartDate, scheduledEndDate],
      );
    });
  }

  async isEmployeeHasSeat(employee, startDate, endDate) {
    const employeeScheduled = await this.findByEmployee({
      employeeId: employee._id,
    });
    if (employeeScheduled.ERROR) {
      return employeeScheduled;
    }

    const employeeSeatIndex = employeeScheduled.findIndex((scheduled) =>
      isDatesOverlap(
        [startDate, endDate],
        [
          scheduled.startDate.setHours(0, 0, 0, 0),
          scheduled.endDate.setHours(0, 0, 0, 0),
        ],
      ),
    );
    if (employeeSeatIndex === -1) {
      return false;
    }
    const seatId = employeeScheduled[employeeSeatIndex].seat;
    const seat = await this.seatService.findSeat({
      id: seatId,
    });
    return { seat: { number: seat.number, id: seatId } };
  }

  async updateScheduledById(
    id: string,
    updateScheduledSeatDto: CreateScheduledSeatDto,
  ) {
    try {
      const startDate = new Date(updateScheduledSeatDto.startDate).setHours(
        0,
        0,
        0,
        0,
      );
      const endDate = new Date(updateScheduledSeatDto.endDate).setHours(
        0,
        0,
        0,
        0,
      );
      const today = new Date().setHours(0, 0, 0, 0);
      if (endDate < startDate) {
        return {
          ERROR: 'End date cannot be before start date',
        };
      }

      if (startDate < today) {
        return {
          ERROR: 'Start date cannot be in the past',
        };
      }

      const seat = await this.seatService.findSeat(
        Object.assign({
          id: updateScheduledSeatDto.seat,
          number: updateScheduledSeatDto.seatNumber,
        }),
      );
      if (seat.ERROR) {
        return seat;
      }

      const isScheduled = await this.isSeatScheduled(
        seat,
        startDate,
        endDate,
        id,
      );
      if (isScheduled) {
        return {
          ERROR: 'Seat is already scheduled for this time',
        };
      }

      const employee = await this.employeeService.findEmployee(
        Object.assign({
          id: updateScheduledSeatDto.employee,
          email: updateScheduledSeatDto.employeeEmail,
        }),
      );
      if (employee.ERROR) {
        return employee;
      }

      const isEmployeeHasSeat = await this.isEmployeeHasSeat(
        employee,
        startDate,
        endDate,
      );
      if (
        isEmployeeHasSeat &&
        isEmployeeHasSeat.seat.number === updateScheduledSeatDto.seatNumber
      ) {
        return {
          ERROR: `Employee already has a seat for this time (${isEmployeeHasSeat.seat.number})`,
        };
      }
      const scheduled = await this.scheduledSeatModel.findByIdAndUpdate(
        id,
        {
          seat,
          employee,
          startDate,
          endDate,
        },
        { new: true },
      );
      if (!scheduled) {
        throw new Error('Error while updating schedule');
      }
      return scheduled;
    } catch (error) {
      return await handleInvalidValueError(error);
    }
  }
}
