import { useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { COLORS } from '../constants/colors'

const MONTHS = [
  { value: 1, label: 'Styczeń' },
  { value: 2, label: 'Luty' },
  { value: 3, label: 'Marzec' },
  { value: 4, label: 'Kwiecień' },
  { value: 5, label: 'Maj' },
  { value: 6, label: 'Czerwiec' },
  { value: 7, label: 'Lipiec' },
  { value: 8, label: 'Sierpień' },
  { value: 9, label: 'Wrzesień' },
  { value: 10, label: 'Październik' },
  { value: 11, label: 'Listopad' },
  { value: 12, label: 'Grudzień' },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const pad2 = (value) => String(value).padStart(2, '0')

const toDateOnly = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const parseIsoDate = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [yearStr, monthStr, dayStr] = value.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  if (!year || !month || !day) {
    return null
  }

  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

const DatePicker = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholderDay = 'DD',
  placeholderMonth = 'MM',
  placeholderYear = 'RRRR',
  disabled = false,
}) => {
  const parsedValue = parseIsoDate(value)

  const initialDate = parsedValue || maximumDate || new Date(2000, 0, 1)

  const [showModal, setShowModal] = useState(false)
  const [tempDay, setTempDay] = useState(initialDate.getDate())
  const [tempMonth, setTempMonth] = useState(initialDate.getMonth() + 1)
  const [tempYear, setTempYear] = useState(initialDate.getFullYear())
  const [localError, setLocalError] = useState('')

  const currentYear = new Date().getFullYear()
  const minYear = minimumDate ? minimumDate.getFullYear() : 1900
  const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear

  const years = useMemo(
    () =>
      Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) =>
        maxYear - i
      ),
    [maxYear, minYear]
  )

  const openDatePicker = () => {
    const sourceDate = parseIsoDate(value) || maximumDate || new Date(2000, 0, 1)
    setTempDay(sourceDate.getDate())
    setTempMonth(sourceDate.getMonth() + 1)
    setTempYear(sourceDate.getFullYear())
    setLocalError('')
    setShowModal(true)
  }

  const closeDatePicker = () => {
    setLocalError('')
    setShowModal(false)
  }

  const confirmDate = () => {
    const selected = new Date(tempYear, tempMonth - 1, tempDay)

    if (
      selected.getFullYear() !== tempYear ||
      selected.getMonth() + 1 !== tempMonth ||
      selected.getDate() !== tempDay
    ) {
      setLocalError('Wybierz prawidłową datę')
      return
    }

    const selectedDateOnly = toDateOnly(selected)
    if (minimumDate && selectedDateOnly < toDateOnly(minimumDate)) {
      setLocalError('Wybrana data jest za wcześnie')
      return
    }

    if (maximumDate && selectedDateOnly > toDateOnly(maximumDate)) {
      setLocalError('Wybrana data jest za późna')
      return
    }

    onChange?.(toIsoDate(selected))
    setShowModal(false)
    setLocalError('')
  }

  const selectedDay = parsedValue ? pad2(parsedValue.getDate()) : placeholderDay
  const selectedMonth = parsedValue
    ? pad2(parsedValue.getMonth() + 1)
    : placeholderMonth
  const selectedYear = parsedValue
    ? String(parsedValue.getFullYear())
    : placeholderYear

  return (
    <>
      <Pressable
        style={[styles.datePickerContainer, disabled && styles.disabled]}
        onPress={openDatePicker}
        disabled={disabled}
      >
        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !parsedValue && styles.datePlaceholder]}>
            {selectedDay}
          </Text>
          <Text style={styles.dateLabel}>Dzień</Text>
        </View>

        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>/</Text>
        </View>

        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !parsedValue && styles.datePlaceholder]}>
            {selectedMonth}
          </Text>
          <Text style={styles.dateLabel}>Miesiąc</Text>
        </View>

        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>/</Text>
        </View>

        <View style={styles.dateBox}>
          <Text style={[styles.dateText, !parsedValue && styles.datePlaceholder]}>
            {selectedYear}
          </Text>
          <Text style={styles.dateLabel}>Rok</Text>
        </View>
      </Pressable>

      <Modal visible={showModal} transparent animationType='slide'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wybierz datę</Text>

            <View style={styles.pickersContainer}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Dzień</Text>
                <Picker
                  selectedValue={tempDay}
                  onValueChange={setTempDay}
                  style={styles.picker}
                >
                  {DAYS.map((day) => (
                    <Picker.Item key={day} label={String(day)} value={day} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Miesiąc</Text>
                <Picker
                  selectedValue={tempMonth}
                  onValueChange={setTempMonth}
                  style={styles.picker}
                >
                  {MONTHS.map((month) => (
                    <Picker.Item
                      key={month.value}
                      label={month.label}
                      value={month.value}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Rok</Text>
                <Picker
                  selectedValue={tempYear}
                  onValueChange={setTempYear}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item key={year} label={String(year)} value={year} />
                  ))}
                </Picker>
              </View>
            </View>

            {!!localError && <Text style={styles.errorText}>{localError}</Text>}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeDatePicker}
              >
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDate}
              >
                <Text style={styles.confirmButtonText}>Potwierdź</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

export default DatePicker

const styles = StyleSheet.create({
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  datePlaceholder: {
    color: '#999',
  },
  dateLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  dateSeparator: {
    paddingHorizontal: 2,
  },
  dateSeparatorText: {
    fontSize: 25,
    color: '#999',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.error,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
